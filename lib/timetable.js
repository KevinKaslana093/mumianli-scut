// Parsing functions adapted from MIT-licensed Keyu. See KEYU-LICENSE.txt.
import {
  course,
  parseWeeks,
  formatWeeks,
  dateNumber,
  addDays,
  dayOf,
  csvRows,
  parseScutPages,
} from "./keyu-core.js";
export { parseWeeks, formatWeeks, dateNumber, addDays, dayOf, parseScutPages };
export const CAMPUSES = {
  wushan: "五山校区",
  university: "大学城校区",
  international: "广州国际校区",
};
const SOUTH = [
  "08:50-09:35",
  "09:40-10:25",
  "10:40-11:25",
  "11:30-12:15",
  "14:00-14:45",
  "14:50-15:35",
  "15:45-16:30",
  "16:35-17:20",
  "19:00-19:45",
  "19:55-20:40",
  "20:50-21:35",
];
export const SLOTS = {
  wushan: [
    "08:00-08:45",
    "08:55-09:40",
    "10:00-10:45",
    "10:55-11:40",
    "14:30-15:15",
    "15:25-16:10",
    "16:20-17:05",
    "17:15-18:00",
    "19:00-19:45",
    "19:55-20:40",
    "20:50-21:35",
  ],
  university: SOUTH,
  international: SOUTH,
};
export const COLORS = [
  "#d9e8dc",
  "#f7e0c7",
  "#e0e4f5",
  "#f4d9d7",
  "#d6e8ed",
  "#ece3ce",
];
export const today = () =>
  new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10);
export const newSchedule = () => ({
  name: "我的课表",
  startDate: "",
  totalWeeks: 22,
  courses: [],
  adjustments: {},
  notes: [],
  reminder: 15,
});
export function normalize(raw, campus = "university") {
  if (raw.campus && !CAMPUSES[raw.campus]) throw Error("课程校区无效");
  const c = course(raw);
  if (typeof c.id !== "string" || c.id.length > 80) throw Error("课程编号无效");
  if (c.end > 11) throw Error(`${c.name}：三校区预设仅有 11 节`);
  return {
    ...c,
    campus: CAMPUSES[raw.campus] ? raw.campus : campus,
    color: COLORS.includes(raw.color) ? raw.color : COLORS[0],
  };
}
export function validate(s) {
  if (!s || !Array.isArray(s.courses) || s.courses.length > 1000)
    throw Error("课表格式无效，最多 1000 条课程");
  const out = {
    ...newSchedule(),
    ...s,
    courses: s.courses.map((x) => normalize(x)),
  };
  if (typeof out.name !== "string" || out.name.length > 60 || !out.name.trim())
    throw Error("课表名称应为 1–60 字");
  if (new Set(out.courses.map((c) => c.id)).size !== out.courses.length)
    throw Error("课表中存在重复的课程编号");
  if (out.startDate && dayOf(out.startDate) !== 1)
    throw Error("第 1 周起始日必须是周一");
  if (
    !Number.isInteger(+out.totalWeeks) ||
    +out.totalWeeks < 1 ||
    +out.totalWeeks > 60
  )
    throw Error("学期应为 1–60 周");
  if (out.courses.some((c) => c.weeks.some((w) => w > +out.totalWeeks)))
    throw Error("课程周次超出学期，请调整学期周数");
  if (
    !out.adjustments ||
    typeof out.adjustments !== "object" ||
    Array.isArray(out.adjustments)
  )
    throw Error("调课数据无效");
  for (const [d, v] of Object.entries(out.adjustments)) {
    dateNumber(d);
    if (v !== null) dateNumber(v);
  }
  if (!Array.isArray(out.notes) || out.notes.some((x) => typeof x !== "string"))
    throw Error("备注数据无效");
  if (![0, 5, 10, 15, 20, 30, 60].includes(+out.reminder))
    throw Error("提醒时间无效");
  out.totalWeeks = +out.totalWeeks;
  out.reminder = +out.reminder;
  return out;
}
export const times = (c) => ({
  from: SLOTS[c.campus][c.start - 1].slice(0, 5),
  to: SLOTS[c.campus][c.end - 1].slice(6),
});
export const weekOf = (s, d = today()) =>
  s.startDate
    ? Math.floor((dateNumber(d) - dateNumber(s.startDate)) / 7) + 1
    : 1;
export function onDate(s, date) {
  if (!s.startDate) return [];
  const source = Object.hasOwn(s.adjustments, date)
    ? s.adjustments[date]
    : date;
  if (source === null) return [];
  const week = weekOf(s, source);
  return s.courses
    .filter((c) => c.day === dayOf(source) && c.weeks.includes(week))
    .sort((a, b) => times(a).from.localeCompare(times(b).from));
}
export function forDay(s, w, day) {
  return s.startDate
    ? onDate(s, addDays(s.startDate, (w - 1) * 7 + day - 1))
    : s.courses.filter((c) => c.day === day && c.weeks.includes(w));
}
export function conflicts(courses) {
  const r = [];
  for (let i = 0; i < courses.length; i++)
    for (let j = i + 1; j < courses.length; j++) {
      const a = courses[i],
        b = courses[j],
        at = times(a),
        bt = times(b);
      if (at.from < bt.to && bt.from < at.to) r.push([a, b]);
    }
  return r;
}
export function parseCSV(text, campus) {
  const rows = csvRows(text),
    h = ["课程名称", "星期", "开始节数", "结束节数", "老师", "地点", "周数"];
  if (!rows.length || h.some((v, i) => rows[0][i]?.trim() !== v))
    throw Error("表头需为：" + h.join("、") + "；可增加第 8 列“校区”");
  return rows.slice(1).map((r, i) => {
    try {
      if (r.length < 7 || r.length > 8) throw Error("应为 7 列或含校区的 8 列");
      const value = r[7]?.trim();
      const cp = Object.keys(CAMPUSES).find(
        (k) => k === value || CAMPUSES[k] === value,
      );
      if (value && !cp)
        throw Error("校区应为五山校区、大学城校区或广州国际校区");
      return normalize(
        {
          name: r[0],
          day: r[1],
          start: r[2],
          end: r[3],
          teacher: r[4] === "无" ? "" : r[4],
          room: r[5] === "无" ? "" : r[5],
          weeks: r[6],
          campus: cp || campus,
          color: COLORS[i % 6],
        },
        campus,
      );
    } catch (e) {
      throw Error(`第 ${i + 2} 行：${e.message}`);
    }
  });
}
export const rowsToCSV = (rows) =>
  rows
    .map((r) =>
      r.map((v) => '"' + String(v ?? "").replace(/"/g, '""') + '"').join(","),
    )
    .join("\r\n");
export const exportCSV = (s) =>
  "\uFEFF" +
  rowsToCSV([
    [
      "课程名称",
      "星期",
      "开始节数",
      "结束节数",
      "老师",
      "地点",
      "周数",
      "校区",
    ],
    ...s.courses.map((c) => [
      c.name,
      c.day,
      c.start,
      c.end,
      c.teacher,
      c.room,
      formatWeeks(c.weeks),
      CAMPUSES[c.campus],
    ]),
  ]);
const esc = (s) =>
  String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
function fold(s) {
  let out = "",
    line = "",
    n = 0;
  for (const c of s) {
    const bytes = new TextEncoder().encode(c).length;
    if (n + bytes > 73) {
      out += line + "\r\n";
      line = " ";
      n = 1;
    }
    line += c;
    n += bytes;
  }
  return out + line;
}
export function exportICS(s) {
  if (!s.startDate) throw Error("请先设置第 1 周周一日期");
  const utc = (d, t) =>
    new Date(`${d}T${t}:00+08:00`)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const dates = new Set(
    Array.from({ length: s.totalWeeks * 7 }, (_, i) => addDays(s.startDate, i)),
  );
  Object.keys(s.adjustments).forEach((d) => dates.add(d));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mumianli//SCUT Timetable//ZH",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:" + esc(s.name),
  ];
  for (const date of [...dates].sort())
    for (const c of onDate(s, date)) {
      const t = times(c);
      lines.push(
        "BEGIN:VEVENT",
        `UID:${c.id}-${date}@mumianli`,
        "DTSTAMP:" +
          new Date()
            .toISOString()
            .replace(/[-:]/g, "")
            .replace(/\.\d{3}/, ""),
        "DTSTART:" + utc(date, t.from),
        "DTEND:" + utc(date, t.to),
        "SUMMARY:" + esc(c.name),
        "LOCATION:" + esc(CAMPUSES[c.campus] + " " + c.room),
        "DESCRIPTION:" + esc(c.teacher + " " + c.note),
      );
      if (+s.reminder > 0)
        lines.push(
          "BEGIN:VALARM",
          `TRIGGER:-PT${s.reminder}M`,
          "ACTION:DISPLAY",
          "DESCRIPTION:" + esc(c.name),
          "END:VALARM",
        );
      lines.push("END:VEVENT");
    }
  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
export async function importFile(file, campus) {
  if (file.size > 12 * 1024 * 1024) throw Error("课表文件不能超过 12 MB");
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "pdf") {
    const { readPDF } = await import("./read-pdf.js");
    const result = await readPDF(await file.arrayBuffer());
    return {
      ...newSchedule(),
      courses: result.courses.map((c, i) =>
        normalize({ ...c, color: COLORS[i % 6] }, campus),
      ),
      notes: result.notes,
    };
  }
  if (ext === "xlsx") {
    const { readSheet } = await import("read-excel-file/browser");
    const rows = await readSheet(file);
    if (rows.some((r) => r.some((v) => v instanceof Date)))
      throw Error("Excel 把周数转换成了日期，请将周数列设为文本");
    return { ...newSchedule(), courses: parseCSV(rowsToCSV(rows), campus) };
  }
  let text = await file.text();
  if (text.includes("\ufffd"))
    text = new TextDecoder("gb18030").decode(await file.arrayBuffer());
  if (ext === "json") {
    const raw = JSON.parse(text);
    return validate(raw.schedule || raw);
  }
  if (["html", "htm"].includes(ext)) {
    const doc = new DOMParser().parseFromString(text, "text/html");
    const table = [...doc.querySelectorAll("table")].find(
      (t) =>
        t.textContent.includes("课程名称") &&
        t.textContent.includes("开始节数"),
    );
    if (!table)
      throw Error("HTML 暂支持标准七列数据表，请改用华工教务导出的 PDF");
    text = rowsToCSV(
      [...table.rows].map((r) => [...r.cells].map((c) => c.textContent.trim())),
    );
  }
  if (!["csv", "html", "htm", "xlsx", "pdf", "json"].includes(ext))
    throw Error("支持文字版 PDF、CSV、XLSX、标准表格 HTML 和 JSON");
  return { ...newSchedule(), courses: parseCSV(text, campus) };
}
