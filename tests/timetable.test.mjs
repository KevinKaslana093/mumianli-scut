import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalize,
  newSchedule,
  validate,
  parseWeeks,
  parseCSV,
  exportCSV,
  exportICS,
  forDay,
  conflicts,
  times,
  SLOTS,
  hasTimes,
  parseScutPages,
} from "../lib/timetable.js";
test("three campuses preserve exact first, afternoon and evening slots", () => {
  assert.equal(SLOTS.wushan.length, 11);
  assert.equal(SLOTS.international[0], "08:50-09:35");
  assert.equal(SLOTS.wushan[4], "14:30-15:15");
  assert.equal(SLOTS.university[4], "14:00-14:45");
  assert.equal(SLOTS.international[10], "20:50-21:35");
});
test("discontinuous odd/even weeks and invalid input", () => {
  assert.deepEqual(parseWeeks("1-5、7-11单"), [1, 2, 3, 4, 5, 7, 9, 11]);
  assert.deepEqual(parseWeeks("2-8双"), [2, 4, 6, 8]);
  assert.throws(() => parseWeeks("18-1"));
  assert.throws(() => parseWeeks("1-18abc"));
});
test("clock conflicts across campuses do not require matching period numbers", () => {
  const a = normalize({
      name: "大学城早课",
      day: 1,
      start: 1,
      end: 1,
      weeks: "1-18",
      campus: "university",
    }),
    b = normalize({
      name: "五山第二节",
      day: 1,
      start: 2,
      end: 2,
      weeks: "1-18",
      campus: "wushan",
    });
  assert.equal(times(a).from, "08:50");
  assert.equal(conflicts([a, b]).length, 1);
});
test("CSV round trip keeps quoted fields and campus; malformed file rejected", () => {
  const c = normalize({
    name: "设计,基础",
    day: 7,
    start: 9,
    end: 11,
    weeks: "2-18双",
    teacher: "李老师",
    room: "F1-201",
    campus: "international",
  });
  const parsed = parseCSV(
    exportCSV({ ...newSchedule(), courses: [c] }),
    "wushan",
  );
  assert.equal(parsed[0].name, c.name);
  assert.equal(parsed[0].campus, c.campus);
  assert.deepEqual(parsed[0].weeks, c.weeks);
  assert.throws(() => parseCSV("任意表头\na,b,c"));
  assert.throws(() =>
    parseCSV(
      '课程名称,星期,开始节数,结束节数,老师,地点,周数\n数学,1,1,2,教师,教室,"1-18',
    ),
  );
});
test("weekday/date overrides use source weeks and can add outside-semester makeup", () => {
  const c = normalize({
    name: "单周数学",
    day: 1,
    start: 1,
    end: 2,
    weeks: "1-17单",
    campus: "wushan",
  });
  const s = {
    ...newSchedule(),
    startDate: "2026-09-07",
    totalWeeks: 18,
    courses: [c],
    adjustments: { "2026-09-07": null, "2027-02-02": "2026-09-07" },
  };
  assert.equal(forDay(s, 1, 1).length, 0);
  assert.equal(forDay(s, 2, 1).length, 0);
  const ics = exportICS(s);
  assert.match(ics, /DTSTART:20270202T000000Z/);
  assert.doesNotMatch(ics, /DTSTART:20260907T000000Z/);
  assert.match(ics, /LOCATION:五山校区/);
});
test("calendar export is UTC+8 and supports no reminder", () => {
  const c = normalize({
    name: "大学城课",
    day: 1,
    start: 1,
    end: 2,
    weeks: "1",
    campus: "university",
  });
  const ics = exportICS({
    ...newSchedule(),
    startDate: "2026-09-07",
    totalWeeks: 1,
    courses: [c],
    reminder: 0,
  });
  assert.match(ics, /DTSTART:20260907T005000Z/);
  assert.match(ics, /DTEND:20260907T022500Z/);
  assert.doesNotMatch(ics, /VALARM/);
  assert.throws(() => exportICS(newSchedule()));
});
test("invalid calendar and period limits are rejected without mutating original", () => {
  const s = newSchedule();
  assert.throws(() => validate({ ...s, startDate: "2026-09-08" }));
  assert.throws(() =>
    normalize({ name: "非法节次", day: 1, start: 10, end: 17, weeks: "1" }),
  );
  assert.throws(() => validate({ ...s, adjustments: { "2026-02-30": null } }));
  assert.equal(s.courses.length, 0);
});
test("extended periods survive import and require confirmed times for calendar export", () => {
  const c = normalize({name:"跨页晚课",day:1,start:9,end:12,weeks:"1",campus:"university"});
  assert.equal(c.end,12);
  assert.equal(times(c).to,"待确认");
  assert.equal(hasTimes(c),false);
  const s={...newSchedule(),startDate:"2026-09-07",courses:[c]};
  assert.equal(validate(s).courses[0].end,12);
  assert.throws(()=>exportICS(s),/时间待确认/);
  const confirmed=normalize({...c,timeTo:"22:20"});
  assert.equal(hasTimes(confirmed),true);
  assert.match(exportICS({...s,courses:[confirmed]}),/DTEND:20260907T142000Z/);
  const restored=parseCSV(exportCSV({...s,courses:[confirmed]}),"wushan")[0];
  assert.equal(restored.timeTo,"22:20");
  assert.equal(restored.campus,"university");
  assert.throws(()=>normalize({...c,timeTo:"18:00"}),/结束时间/);
  assert.throws(()=>normalize({...c,timeTo:"25:00"}),/HH:mm/);
});
test("SCUT PDF parser preserves course continuation, twelfth period and explicit campus", () => {
  const item=(str,x,y)=>({str,x,y,width:20});
  const headers=[..."一二三四五六日"].map((d,i)=>item("星期"+d,100+i*100,20));
  const pages=[
    {height:800,items:[...headers,item("测试课程(9-11节)4-5周/校区:大学城校区/场地:测试教室/教师:",100,50)]},
    {height:800,items:[item("测试教师/学分:1.0(9-12节)9周/校区:大学城校区/场地:测试教室/教师:测试教师/学分:1.0",100,30),item("实践课程：测试实践",100,700)]},
  ];
  const {courses}=parseScutPages(pages);
  assert.equal(courses.length,2);
  assert.equal(courses[1].name,"测试课程");
  assert.equal(courses[1].end,12);
  assert.deepEqual(courses[1].weeks,[9]);
  assert.equal(normalize(courses[1],"wushan").campus,"university");
  assert.equal(courses[0].teacher,"测试教师");
});
