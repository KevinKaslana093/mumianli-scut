"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  CalendarDays,
  MessagesSquare,
  Clock3,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Download,
  Settings2,
  MapPin,
  BookOpen,
  Heart,
  Bookmark,
  MessageCircle,
  Search,
  X,
  LogOut,
  UserRound,
  Flower2,
  Leaf,
  Flag,
  Check,
  Trash2,
  Copy,
  ImagePlus,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Info,
  CalendarCheck,
  Bus,
  GraduationCap,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import {
  CAMPUSES,
  SLOTS,
  COLORS,
  newSchedule,
  normalize,
  validate,
  today,
  weekOf,
  dayOf,
  addDays,
  dateNumber,
  forDay,
  onDate,
  times,
  conflicts,
  parseWeeks,
  formatWeeks,
  exportCSV,
  exportICS,
  importFile,
  rowsToCSV,
} from "../lib/timetable.js";
const DAYS = ["一", "二", "三", "四", "五", "六", "日"],
  CATEGORIES = [
    "日常分享",
    "学习互助",
    "失物招领",
    "活动组队",
    "闲置交换",
    "心声树洞",
  ];
const DEMO = {
  ...newSchedule(),
  name: "示例课表",
  courses: [
    ["高等数学", 1, 1, 2, "university", "A1-201", 0],
    ["大学英语", 1, 5, 6, "university", "A2-302", 1],
    ["线性代数", 2, 3, 4, "wushan", "博学楼 201", 2],
    ["程序设计", 3, 1, 2, "university", "A3-401", 4],
    ["体育", 3, 7, 8, "university", "田径场", 0],
    ["大学物理", 4, 3, 4, "international", "F1-203", 3],
    ["学术写作", 4, 9, 10, "international", "F1-201", 5],
    ["数据结构", 5, 5, 6, "university", "A1-303", 2],
  ].map(([name, day, start, end, campus, room, color], i) =>
    normalize({
      id: "demo-" + i,
      name,
      day,
      start,
      end,
      campus,
      room,
      color: COLORS[color],
      teacher: "示例教师",
      weeks: i === 5 ? "1-17单" : "1-18",
    }),
  ),
};
function saveFile(name, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
async function api(path, { method = "GET", data, raw, adminKey } = {}) {
  const r = await fetch("/api/" + path, {
    method,
    cache: "no-store",
    headers: {
      "x-mumian-client": "1",
      ...(raw ? {} : { "Content-Type": "application/json" }),
      ...(adminKey ? { "x-admin-key": adminKey } : {}),
    },
    body: raw || (data ? JSON.stringify(data) : undefined),
  });
  let value;
  try {
    value = await r.json();
  } catch {
    throw Error("服务返回异常，请稍后重试");
  }
  if (!r.ok) throw Error(value.error || "操作失败");
  return value;
}
function CampusSelect({
  name = "campus",
  value = "university",
  all = false,
  onChange,
}) {
  return (
    <select
      aria-label="选择校区"
      name={name}
      defaultValue={onChange ? undefined : value}
      value={onChange ? value : undefined}
      onChange={onChange}
    >
      {all && <option value="all">全部校区</option>}
      {Object.entries(CAMPUSES).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      className={"modal " + (wide ? "wide" : "")}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-inner">
        <header>
          <div>
            <span className="eyebrow">MUMIANLI · 木棉里</span>
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" aria-label="关闭弹窗" onClick={onClose}>
            <X size={21} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function CampusArt() {
  return (
    <svg
      className="campus-art"
      viewBox="0 0 420 180"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="332" cy="56" r="39" fill="#f2bd85" />
      <path
        d="M0 167C90 128 121 158 193 155C277 151 322 113 420 141V180H0Z"
        fill="#cfdecd"
      />
      <g stroke="#789180" strokeWidth="1.5">
        <path
          d="M98 153V88H269V153M88 88H279L265 78H102L88 88ZM168 78V46H201V78M161 46H208L199 38H170L161 46Z"
          fill="#f3eddd"
        />
        <path d="M111 98H256M111 118H256M111 138H256M122 98V153M146 98V153M171 98V153M195 98V153M220 98V153M244 98V153M181 46V72M189 46V72" />
        <path d="M86 153H283M71 158H298M54 164H316" />
        <path d="M41 151V101M330 154V97M366 154V117" />
      </g>
      <g fill="#688d73">
        <ellipse cx="41" cy="102" rx="22" ry="29" />
        <ellipse cx="330" cy="98" rx="24" ry="33" />
        <ellipse cx="366" cy="118" rx="19" ry="24" />
      </g>
      <path
        d="M275 27L285 23L295 27M309 39L316 36L323 39"
        stroke="#8c9b87"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
export default function CampusApp() {
  const [view, setView] = useState("timetable"),
    [schedule, setSchedule] = useState(newSchedule),
    [demo, setDemo] = useState(false),
    [ready, setReady] = useState(false),
    [week, setWeek] = useState(1),
    [campus, setCampus] = useState("all"),
    [day, setDay] = useState(1),
    [layout, setLayout] = useState("week"),
    [user, setUser] = useState(null),
    [modal, setModal] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useState(""),
    [posts, setPosts] = useState([]),
    [loading, setLoading] = useState(false),
    [feedError, setFeedError] = useState(""),
    [category, setCategory] = useState("全部"),
    [scope, setScope] = useState("all"),
    [sort, setSort] = useState("latest"),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0),
    [hasMore, setHasMore] = useState(false),
    [comments, setComments] = useState([]),
    [commentError, setCommentError] = useState(""),
    [preview, setPreview] = useState(null),
    [importCampus, setImportCampus] = useState("university"),
    [image, setImage] = useState(null),
    [reports, setReports] = useState([]),
    [adminKey, setAdminKey] = useState("");
  const feedSeq = useRef(0),
    timer = useRef(),
    fileRef = useRef();
  const s = demo ? DEMO : schedule;
  const notify = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  };
  const open = (kind, item) => {
    setError("");
    setBusy(false);
    setImage(null);
    setPreview(null);
    setModal({ kind, item });
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mumianli-timetable-v1");
      if (raw) {
        const value = validate(JSON.parse(raw));
        setSchedule(value);
        setWeek(Math.max(1, Math.min(value.totalWeeks, weekOf(value))));
      }
      setDay(dayOf(today()));
      if (matchMedia("(max-width: 760px)").matches) setLayout("day");
    } catch {
      notify("本机课表读取失败，原数据已保留，可重新导入备份");
    }
    setReady(true);
    api("me")
      .then((r) => setUser(r.user))
      .catch(() => {});
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);
  const loadPosts = useCallback(
    async (append = false) => {
      const seq = ++feedSeq.current;
      setLoading(true);
      setFeedError("");
      try {
        const r = await api(
          "posts?" +
            new URLSearchParams({
              campus,
              category,
              scope,
              sort,
              q: query,
              page: String(append ? page : 0),
            }),
        );
        if (seq !== feedSeq.current) return;
        setPosts((old) =>
          append
            ? [
                ...old,
                ...r.posts.filter((p) => !old.some((x) => x.id === p.id)),
              ]
            : r.posts,
        );
        setHasMore(r.hasMore);
      } catch (e) {
        if (seq === feedSeq.current) setFeedError(e.message);
      } finally {
        if (seq === feedSeq.current) setLoading(false);
      }
    },
    [campus, category, scope, sort, query, page],
  );
  useEffect(() => {
    if (view === "wall") {
      setPage(0);
      loadPosts();
    }
  }, [view, campus, category, scope, sort, query, user]);
  useEffect(() => {
    if (page > 0 && view === "wall") loadPosts(true);
  }, [page]);
  useEffect(() => {
    if (view !== "wall") return;
    const refresh = () => {
      if (document.visibilityState === "visible") {
        setPage(0);
        loadPosts();
      }
    };
    const t = setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", refresh);
    };
  }, [view, loadPosts]);
  function commit(value) {
    const checked = validate(value);
    try {
      localStorage.setItem("mumianli-timetable-v1", JSON.stringify(checked));
    } catch {
      throw Error("本机存储不可用。请先导出备份，或允许浏览器保存网站数据");
    }
    setSchedule(checked);
    setDemo(false);
  }
  async function task(fn) {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const auth = () => {
    if (!user) {
      open("login");
      return false;
    }
    return true;
  };
  const visibleDays = Array.from({ length: 7 }, (_, i) => i + 1),
    weekCourses = visibleDays.flatMap((d) => forDay(s, week, d)),
    filtered = weekCourses.filter(
      (c) => campus === "all" || c.campus === campus,
    ),
    conflictList = visibleDays.flatMap((d) =>
      conflicts(forDay(s, week, d)).map((pair) => ({ day: d, pair })),
    ),
    todayCourses = onDate(s, today()),
    nowTime = new Date(Date.now() + 8 * 3600000).toISOString().slice(11, 16),
    next = todayCourses.find((c) => times(c).to > nowTime),
    currentWeek = weekOf(s),
    dateFor = (d) =>
      s.startDate ? addDays(s.startDate, (week - 1) * 7 + d - 1) : "";
  async function readFile(file) {
    if (!file) return;
    await task(async () => {
      const result = await importFile(file, importCampus);
      if (!result.courses.length) throw Error("文件中没有可导入课程");
      setPreview({ ...result, name: file.name.replace(/\.[^.]+$/, "") });
    });
  }
  async function uploadPicture(file) {
    if (!file) return;
    await task(async () => {
      if (file.size > 12 * 1024 * 1024) throw Error("原图不能超过 12 MB");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw Error("请选择 JPG、PNG 或 WebP 图片");
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas"),
        scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85),
      );
      if (!blob) throw Error("图片处理失败");
      const r = await api("upload", { method: "POST", raw: blob });
      setImage(r.id);
    });
  }
  async function showPost(post) {
    open("post", post);
    setComments([]);
    setCommentError("");
    try {
      const r = await api(`posts/${post.id}/comments`);
      setComments(r.comments);
    } catch (e) {
      setCommentError(e.message);
    }
  }
  async function reaction(post, kind) {
    if (!auth()) return;
    try {
      await api(`posts/${post.id}/reaction`, {
        method: "POST",
        data: { kind, active: !post[kind === "like" ? "liked" : "saved"] },
      });
      const prop = kind === "like" ? "liked" : "saved",
        change = (p) =>
          p.id === post.id
            ? {
                ...p,
                [prop]: !p[prop],
                likes: kind === "like" ? p.likes + (p.liked ? -1 : 1) : p.likes,
              }
            : p;
      setPosts((old) => old.map(change));
      setModal((old) =>
        old?.kind === "post" ? { ...old, item: change(old.item) } : old,
      );
    } catch (e) {
      notify(e.message);
    }
  }
  const exportAction = (kind) => {
    try {
      if (kind === "ics")
        saveFile("木棉里课表.ics", exportICS(s), "text/calendar;charset=utf-8");
      if (kind === "json")
        saveFile(
          "木棉里课表备份.json",
          JSON.stringify(s, null, 2),
          "application/json",
        );
      if (kind === "csv")
        saveFile("木棉里课表.csv", exportCSV(s), "text/csv;charset=utf-8");
      notify("文件已导出");
    } catch (e) {
      notify(e.message);
    }
  };
  function switchView(v) {
    setView(v);
    setScope("all");
    setSearch("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function card(c, key) {
    const t = times(c);
    return (
      <button
        key={key || c.id}
        className="course"
        style={{ background: c.color }}
        onClick={() => open("course", c)}
      >
        <span className="course-name">{c.name}</span>
        <span>{c.room || "教室待定"}</span>
        <span className="course-campus">
          <MapPin size={10} />
          {CAMPUSES[c.campus].replace("校区", "")}
        </span>
        <span className="course-time">
          {t.from}–{t.to}
        </span>
      </button>
    );
  }
  const postCard = (p) => (
    <article className="post-card" key={p.id}>
      <div className="post-meta">
        <span className={"avatar a" + (CATEGORIES.indexOf(p.category) % 4)}>
          {p.author.slice(0, 1)}
        </span>
        <div>
          <strong>{p.author}</strong>
          <small>
            {CAMPUSES[p.campus]} ·{" "}
            {new Date(p.created).toLocaleDateString("zh-CN", {
              timeZone: "Asia/Shanghai",
              month: "numeric",
              day: "numeric",
            })}
          </small>
        </div>
        <span className="tag">{p.category}</span>
      </div>
      <button className="post-content" onClick={() => showPost(p)}>
        <h3>
          {p.title}
          {p.status === "resolved" && <span className="resolved">已解决</span>}
        </h3>
        <p>{p.content}</p>
        {p.image && (
          <img
            className="post-image"
            src={"/api/images/" + p.image}
            alt={p.title + "的配图"}
            loading="lazy"
          />
        )}
      </button>
      {p.location && (
        <span className="post-location">
          <MapPin size={13} />
          {p.location}
        </span>
      )}
      <div className="post-actions">
        <button
          className={p.liked ? "active" : ""}
          aria-label={"赞同 " + p.title}
          onClick={() => reaction(p, "like")}
        >
          <Heart size={17} fill={p.liked ? "currentColor" : "none"} />
          {p.likes || "赞同"}
        </button>
        <button onClick={() => showPost(p)}>
          <MessageCircle size={17} />
          {p.comments || "评论"}
        </button>
        <button
          className={p.saved ? "active" : ""}
          aria-label={"收藏 " + p.title}
          onClick={() => reaction(p, "save")}
        >
          <Bookmark size={17} fill={p.saved ? "currentColor" : "none"} />
          {p.saved ? "已收藏" : "收藏"}
        </button>
        <button
          className="post-more"
          aria-label={"举报 " + p.title}
          onClick={() => {
            if (auth()) open("report", p);
          }}
        >
          <Flag size={15} />
        </button>
      </div>
    </article>
  );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            switchView("timetable");
          }}
        >
          <img src="/favicon.svg" alt="" />
          <span>
            木棉里<small>MUMIANLI</small>
          </span>
        </a>
        <div className="sidebar-caption">在华园，好好生活。</div>
        <nav aria-label="主导航">
          <button
            className={view === "timetable" ? "selected" : ""}
            onClick={() => switchView("timetable")}
          >
            <CalendarDays size={20} />
            我的课表<span>01</span>
          </button>
          <button
            className={view === "wall" && scope === "all" ? "selected" : ""}
            onClick={() => switchView("wall")}
          >
            <MessagesSquare size={20} />
            校园墙<span>02</span>
          </button>
          <div className="nav-divider" />
          <span className="nav-label">我的校园</span>
          <button
            className={view === "wall" && scope === "saved" ? "selected" : ""}
            onClick={() => {
              if (auth()) {
                setView("wall");
                setScope("saved");
              }
            }}
          >
            <Bookmark size={19} />
            我的收藏
          </button>
          <button
            className={view === "wall" && scope === "mine" ? "selected" : ""}
            onClick={() => {
              if (auth()) {
                setView("wall");
                setScope("mine");
              }
            }}
          >
            <UserRound size={19} />
            我的发布
          </button>
          <button onClick={() => open("guide")}>
            <BookOpen size={19} />
            校园指南
            <ArrowUpRight size={14} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="side-note">
            <Flower2 size={27} />
            <p>
              三座校园，
              <br />
              同一种归属感。
            </p>
            <span>五山 / 大学城 / 广州国际</span>
          </div>
          <button
            className="profile-button"
            onClick={() => open(user ? "profile" : "login")}
          >
            <span className="avatar">
              {user ? user.nickname.slice(0, 1) : <UserRound size={18} />}
            </span>
            <span>
              {user ? user.nickname : "登录木棉里"}
              <small>{user ? "管理我的账号" : "用昵称，认识新同学"}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="top-location">
            <Leaf size={16} />
            <span>华南理工大学 · 学生生活空间</span>
          </span>
          <div>
            <button className="top-help" onClick={() => open("guide")}>
              <HelpCircle size={17} />
              <span>使用指南</span>
            </button>
            <button
              className="mobile-user icon-btn"
              onClick={() => open(user ? "profile" : "login")}
              aria-label="我的账号"
            >
              <UserRound size={20} />
            </button>
            <span className="today-label">
              {today().replace(/-/g, ".")}{" "}
              <span>星期{DAYS[dayOf(today()) - 1]}</span>
            </span>
          </div>
        </header>
        <main>
          <section className="hero">
            <div>
              <span className="eyebrow">YOUR CAMPUS, YOUR EVERYDAY</span>
              <h1>
                {view === "timetable" ? (
                  <>
                    每一天，都有<span>好安排。</span>
                  </>
                ) : (
                  <>
                    华园新鲜事，<span>一起聊聊。</span>
                  </>
                )}
              </h1>
              <p>
                {view === "timetable"
                  ? "从早八到晚课，让学习与生活都从容一点。"
                  : "分享日常、寻找同伴，让三座校园离得更近。"}
              </p>
              <div className="hero-campus">
                <span />
                <span>五山</span>
                <i />
                大学城
                <i />
                广州国际
              </div>
            </div>
            <CampusArt />
            <div className="hero-stamp">
              <Flower2 size={23} />
              <span>
                木棉相伴
                <br />
                <b>华园日常</b>
              </span>
            </div>
          </section>
          <div className="mobile-tabs">
            <button
              className={view === "timetable" ? "active" : ""}
              onClick={() => switchView("timetable")}
            >
              <CalendarDays size={18} />
              课表
            </button>
            <button
              className={view === "wall" ? "active" : ""}
              onClick={() => switchView("wall")}
            >
              <MessagesSquare size={18} />
              校园墙
            </button>
          </div>
          {view === "timetable" ? (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">MY TIMETABLE</span>
                  <h2>
                    {s.name}
                    <span className="subtle-badge">
                      {demo ? "演示" : "本机保存"}
                    </span>
                  </h2>
                </div>
                <div className="toolbar">
                  <button
                    className="secondary"
                    aria-label="校历设置"
                    onClick={() => open("settings")}
                  >
                    <Settings2 size={16} />
                    <span>校历设置</span>
                  </button>
                  <button
                    className="secondary"
                    aria-label="导入课表"
                    onClick={() => open("import")}
                  >
                    <Upload size={16} />
                    <span>导入课表</span>
                  </button>
                  <button className="primary" onClick={() => open("course")}>
                    <Plus size={18} />
                    添加课程
                  </button>
                </div>
              </div>
              {demo && (
                <div className="notice demo-notice">
                  <Info size={16} />
                  <span>
                    正在查看虚构示例，教室与课程仅用于体验。编辑后将保存为你的本机课表。
                  </span>
                  <button onClick={() => setDemo(false)}>
                    退出示例
                    <X size={14} />
                  </button>
                </div>
              )}
              {!s.startDate && (
                <div className="notice">
                  <CalendarCheck size={16} />
                  <span>先设置第 1 周周一，就能显示真实日期和今天的课程。</span>
                  <button onClick={() => open("settings")}>
                    设置校历
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}
              <div className="schedule-layout">
                <section className="schedule-panel">
                  <div className="schedule-toolbar">
                    <div className="week-switch">
                      <button
                        className="icon-btn"
                        aria-label="上一周"
                        disabled={week <= 1}
                        onClick={() => setWeek(week - 1)}
                      >
                        <ChevronLeft size={19} />
                      </button>
                      <select
                        aria-label="选择教学周"
                        value={week}
                        onChange={(e) => setWeek(+e.target.value)}
                      >
                        {Array.from({ length: +s.totalWeeks }, (_, i) => (
                          <option value={i + 1} key={i}>
                            第 {i + 1} 周
                          </option>
                        ))}
                      </select>
                      <button
                        className="icon-btn"
                        aria-label="下一周"
                        disabled={week >= s.totalWeeks}
                        onClick={() => setWeek(week + 1)}
                      >
                        <ChevronRight size={19} />
                      </button>
                      <button
                        className="text-button return-week"
                        disabled={!s.startDate}
                        onClick={() => {
                          if (currentWeek < 1 || currentWeek > s.totalWeeks)
                            notify("今天不在当前学期内");
                          else setWeek(currentWeek);
                        }}
                      >
                        本周
                      </button>
                    </div>
                    <div className="schedule-options">
                      <CampusSelect
                        all
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                      />
                      <div className="segmented">
                        <button
                          className={layout === "week" ? "active" : ""}
                          onClick={() => setLayout("week")}
                        >
                          周
                        </button>
                        <button
                          className={layout === "day" ? "active" : ""}
                          onClick={() => setLayout("day")}
                        >
                          日
                        </button>
                      </div>
                    </div>
                  </div>
                  {!s.courses.length && (
                    <div className="first-schedule">
                      <div>
                        <Flower2 size={22} />
                        <span>
                          <strong>第一张课表，从这里开始</strong>
                          <small>导入教务文件，或手动添上你的课程。</small>
                        </span>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => {
                          setDemo(true);
                          setWeek(1);
                        }}
                      >
                        先看示例
                        <ArrowUpRight size={16} />
                      </button>
                    </div>
                  )}
                  {layout === "day" && (
                    <div className="day-switch">
                      {visibleDays.map((d) => (
                        <button
                          key={d}
                          className={day === d ? "active" : ""}
                          onClick={() => setDay(d)}
                        >
                          周{DAYS[d - 1]}
                          <small>
                            {dateFor(d)
                              ? dateFor(d).slice(5).replace("-", "/")
                              : "—"}
                          </small>
                        </button>
                      ))}
                    </div>
                  )}
                  {layout === "week" ? (
                    <div className="grid-scroll">
                      <div className="week-grid">
                        <div className="grid-header">
                          <span className="grid-corner">
                            {s.startDate
                              ? dateFor(1).slice(5, 7) + "月"
                              : "节次"}
                          </span>
                          {visibleDays.map((d) => (
                            <div
                              key={d}
                              className={
                                dateFor(d) === today() ? "is-today" : ""
                              }
                            >
                              周{DAYS[d - 1]}
                              <small>
                                {dateFor(d) ? dateFor(d).slice(8) : "—"}
                              </small>
                            </div>
                          ))}
                        </div>
                        <div className="grid-body">
                          <div className="time-axis">
                            {SLOTS.university.map((slot, i) => (
                              <div
                                key={i}
                                className={
                                  i === 4 || i === 8 ? "period-break" : ""
                                }
                              >
                                <b>{String(i + 1).padStart(2, "0")}</b>
                                {campus !== "all" && (
                                  <small>
                                    {SLOTS[campus][i].slice(0, 5)}
                                    <br />
                                    {SLOTS[campus][i].slice(6)}
                                  </small>
                                )}
                                {campus === "all" && (
                                  <small>
                                    {i < 4 ? "上午" : i < 8 ? "下午" : "晚上"}
                                  </small>
                                )}
                              </div>
                            ))}
                          </div>
                          {visibleDays.map((d) => (
                            <div className="day-column" key={d}>
                              {Array.from({ length: 11 }, (_, i) => (
                                <button
                                  className={
                                    "empty-cell " +
                                    (i === 4 || i === 8 ? "period-break" : "")
                                  }
                                  key={i}
                                  aria-label={`周${DAYS[d - 1]}第${i + 1}节添加课程`}
                                  onClick={() =>
                                    open("course", {
                                      day: d,
                                      start: i + 1,
                                      end: Math.min(11, i + 2),
                                      campus:
                                        campus === "all"
                                          ? "university"
                                          : campus,
                                    })
                                  }
                                />
                              ))}
                              <div className="course-layer">
                                {forDay(s, week, d)
                                  .filter(
                                    (c) =>
                                      campus === "all" || c.campus === campus,
                                  )
                                  .map((c, i, all) => {
                                    const overlap = all.filter(
                                        (x) =>
                                          x.start <= c.end && x.end >= c.start,
                                      ),
                                      pos = overlap.findIndex(
                                        (x) => x.id === c.id,
                                      );
                                    return (
                                      <div
                                        key={c.id}
                                        className="course-placement"
                                        style={{
                                          top: (c.start - 1) * 66 + 3,
                                          height:
                                            (c.end - c.start + 1) * 66 - 6,
                                          left: `calc(${(pos * 100) / overlap.length}% + 3px)`,
                                          width: `calc(${100 / overlap.length}% - 6px)`,
                                        }}
                                      >
                                        {card(c)}
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="daily-list">
                      {forDay(s, week, day)
                        .filter((c) => campus === "all" || c.campus === campus)
                        .sort((a, b) =>
                          times(a).from.localeCompare(times(b).from),
                        )
                        .map((c) => (
                          <div className="daily-course" key={c.id}>
                            <div>
                              <strong>{times(c).from}</strong>
                              <small>{times(c).to}</small>
                            </div>
                            {card(c)}
                          </div>
                        ))}
                      {!forDay(s, week, day).filter(
                        (c) => campus === "all" || c.campus === campus,
                      ).length && (
                        <div className="empty-inline">
                          <Leaf size={32} />
                          <h3>这一天，留一点自由。</h3>
                          <p>当前周与校区没有课程安排。</p>
                          <button
                            className="secondary"
                            onClick={() =>
                              open("course", { day, start: 1, end: 2 })
                            }
                          >
                            <Plus size={16} />
                            添加课程
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="schedule-bottom">
                    <span>
                      <i className="green-dot" />
                      {filtered.length} 个上课时段 ·{" "}
                      {campus === "all"
                        ? "卡片显示课程所属校区的实际时间"
                        : CAMPUSES[campus]}
                    </span>
                    <button
                      className="text-button"
                      onClick={() => open("export")}
                    >
                      <Download size={15} />
                      导出 / 备份
                    </button>
                  </div>
                </section>
                <aside className="context-column">
                  <section className="today-card">
                    <span className="eyebrow">TODAY'S NEXT</span>
                    <div className="today-title">
                      <h3>下一节课</h3>
                      <Clock3 size={19} />
                    </div>
                    {next ? (
                      <>
                        <strong className="next-time">
                          {times(next).from}
                        </strong>
                        <h4>{next.name}</h4>
                        <p>
                          {CAMPUSES[next.campus]} · {next.room || "教室待定"}
                        </p>
                        <span className="next-status">
                          {times(next).from <= nowTime
                            ? "正在上课"
                            : "今天稍后"}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="quiet-icon">
                          <Leaf size={37} />
                        </div>
                        <h4>
                          {s.startDate
                            ? "此刻，轻松一点。"
                            : "从一张课表开始。"}
                        </h4>
                        <p>
                          {s.startDate
                            ? "今天接下来没有课程安排。"
                            : "设置校历后，在这里查看下一节课。"}
                        </p>
                        <button
                          onClick={() =>
                            open(s.startDate ? "course" : "settings")
                          }
                        >
                          {s.startDate ? "添加课程" : "设置校历"}
                          <ArrowRight size={15} />
                        </button>
                      </>
                    )}
                  </section>
                  <section className="tips-card">
                    <span className="eyebrow">CAMPUS RHYTHM</span>
                    <h3>三校区，各有节奏</h3>
                    <div className="time-tip">
                      <span>五山校区</span>
                      <strong>
                        08:00 <small>第一节</small>
                      </strong>
                    </div>
                    <div className="time-tip">
                      <span>大学城 · 广州国际</span>
                      <strong>
                        08:50 <small>第一节</small>
                      </strong>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => open("times")}
                    >
                      完整作息对照
                      <ArrowUpRight size={15} />
                    </button>
                  </section>
                  <section className="small-links">
                    <button onClick={() => open("adjust")}>
                      <CalendarCheck size={18} />
                      <span>停课与补课</span>
                      <ChevronRight size={15} />
                    </button>
                    <a
                      href="https://www2.scut.edu.cn/gzic/2021/1025/c30320a448333/page.htm"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Bus size={18} />
                      <span>官方交通指引</span>
                      <ArrowUpRight size={15} />
                    </a>
                  </section>
                </aside>
              </div>
              {conflictList.length > 0 && (
                <div className="conflict-box">
                  <Info size={18} />
                  <div>
                    <strong>本周有 {conflictList.length} 处课程时间冲突</strong>
                    {conflictList.map((x, i) => (
                      <p key={i}>
                        周{DAYS[x.day - 1]}：
                        {x.pair
                          .map((c) => c.name + "（" + times(c).from + "）")
                          .join(" / ")}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {visibleDays.map((d) => {
                const list = forDay(s, week, d).sort((a, b) =>
                  times(a).from.localeCompare(times(b).from),
                );
                const changes = list
                  .slice(1)
                  .map((c, i) => ({ a: list[i], b: c }))
                  .filter(
                    ({ a, b }) =>
                      a.campus !== b.campus && times(a).to <= times(b).from,
                  );
                return changes.map(({ a, b }, i) => (
                  <div className="travel-note" key={d + "-" + i}>
                    <Bus size={16} />
                    <span>
                      周{DAYS[d - 1]}从{CAMPUSES[a.campus]}到
                      {CAMPUSES[b.campus]}，两课间隔{" "}
                      {Number(times(b).from.slice(0, 2)) * 60 +
                        Number(times(b).from.slice(3)) -
                        Number(times(a).to.slice(0, 2)) * 60 -
                        Number(times(a).to.slice(3))}{" "}
                      分钟，请提前规划出行。
                    </span>
                  </div>
                ));
              })}
              {s.notes.length > 0 && (
                <section className="semester-notes">
                  <h3>学期事项 / 导入备注</h3>
                  {s.notes.map((n, i) => (
                    <p key={i}>{n}</p>
                  ))}
                </section>
              )}
            </>
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <span className="eyebrow">CAMPUS WALL</span>
                  <h2>
                    {scope === "mine"
                      ? "我的发布"
                      : scope === "saved"
                        ? "我的收藏"
                        : "课间，也有新鲜事。"}
                  </h2>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    if (auth()) open("compose");
                  }}
                >
                  <Plus size={18} />
                  发布动态
                </button>
              </div>
              <div className="wall-layout">
                <section>
                  <div className="wall-filters">
                    <div className="search-box">
                      <Search size={18} />
                      <input
                        aria-label="搜索校园墙"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="搜索校园里的新鲜事…"
                      />
                      {search && (
                        <button
                          className="icon-btn"
                          aria-label="清空搜索"
                          onClick={() => setSearch("")}
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    <CampusSelect
                      all
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                    />
                  </div>
                  <div className="categories">
                    {["全部", ...CATEGORIES].map((c) => (
                      <button
                        key={c}
                        className={category === c ? "active" : ""}
                        onClick={() => setCategory(c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="feed-toolbar">
                    <div>
                      <button
                        className={sort === "latest" ? "active" : ""}
                        onClick={() => setSort("latest")}
                      >
                        最新
                      </button>
                      <button
                        className={sort === "hot" ? "active" : ""}
                        onClick={() => setSort("hot")}
                      >
                        热门
                      </button>
                    </div>
                    <button
                      className="text-button"
                      disabled={loading}
                      onClick={() => {
                        setPage(0);
                        loadPosts();
                      }}
                    >
                      <RefreshCw size={14} className={loading ? "spin" : ""} />
                      刷新动态
                    </button>
                  </div>
                  {feedError && (
                    <div className="error-box" role="alert">
                      {feedError}
                      <button onClick={() => loadPosts()}>重试</button>
                    </div>
                  )}
                  <div className="feed">{posts.map(postCard)}</div>
                  {loading && !posts.length && (
                    <div className="feed-loading">
                      <RefreshCw className="spin" size={22} />
                      正在看看校园里有什么新鲜事…
                    </div>
                  )}
                  {!loading && !feedError && !posts.length && (
                    <div className="wall-empty">
                      <div>
                        <MessagesSquare size={42} />
                        <Flower2 size={24} />
                      </div>
                      <span className="eyebrow">A NEW STORY STARTS HERE</span>
                      <h3>
                        {query
                          ? "暂时没有找到相关动态"
                          : scope === "saved"
                            ? "把喜欢的日常，留在这里。"
                            : scope === "mine"
                              ? "你的第一条动态，等你来写。"
                              : "校园的第一条故事，等你来写。"}
                      </h3>
                      <p>
                        {query || category !== "全部" || campus !== "all"
                          ? "试试其他关键词、分类或校区。"
                          : "分享一件小事、发出一个邀约，或帮同学找回遗失的物品。"}
                      </p>
                      <button
                        className="primary"
                        onClick={() => {
                          if (auth()) open("compose");
                        }}
                      >
                        <Plus size={17} />
                        写一条动态
                      </button>
                    </div>
                  )}
                  {hasMore && (
                    <button
                      className="load-more secondary"
                      disabled={loading}
                      onClick={() => setPage(page + 1)}
                    >
                      {loading ? "加载中…" : "看看更多"}
                    </button>
                  )}
                </section>
                <aside className="context-column">
                  <section className="wall-welcome">
                    <Flower2 size={31} />
                    <span className="eyebrow">HELLO, SCUTER</span>
                    <h3>
                      一面墙，
                      <br />
                      连接三座校园。
                    </h3>
                    <p>
                      让有用的信息被看见，
                      <br />
                      让平凡的日常被分享。
                    </p>
                    <button onClick={() => open("rules")}>
                      看看社区约定
                      <ArrowUpRight size={16} />
                    </button>
                  </section>
                  <section className="tips-card">
                    <h3>这里可以聊什么？</h3>
                    {[
                      ["学习互助", "找一个一起进步的搭子"],
                      ["失物招领", "让丢失的小物回家"],
                      ["活动组队", "把同好变成队友"],
                    ].map(([c, t]) => (
                      <button
                        className="category-tip"
                        key={c}
                        onClick={() => setCategory(c)}
                      >
                        <span>{c}</span>
                        <small>{t}</small>
                        <ArrowUpRight size={14} />
                      </button>
                    ))}
                  </section>
                  <div className="wall-footnote">
                    <Info size={15} />
                    <p>
                      独立学生交流项目。公开发布前，请遮挡校园卡、证件上的个人信息。
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
          <footer className="footer">
            <span>
              <Flower2 size={15} />
              木棉里 · 让华园日常，更近一点。
            </span>
            <div>
              <button onClick={() => open("guide")}>关于与来源</button>
              <button onClick={() => open("rules")}>社区约定</button>
              <button onClick={() => open("admin")}>管理入口</button>
            </div>
            <small>独立学生项目，非华南理工大学官方服务</small>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {modal && (
        <Modal
          title={
            {
              course: modal.item?.id ? "课程详情" : "添加课程",
              settings: "校历设置",
              import: "导入课表",
              export: "导出与备份",
              times: "三校区作息对照",
              adjust: "停课与补课",
              login: "欢迎回到木棉里",
              register: "认识一下，华园新同学",
              recover: "使用恢复码找回账号",
              recovery: "请保存账号恢复码",
              compose: modal.item ? "编辑动态" : "分享你的华园日常",
              post: "校园动态",
              report: "举报这条动态",
              profile: "我的账号",
              guide: "关于木棉里",
              rules: "社区约定",
              admin: "社区管理",
              "delete-post": "撤回动态",
            }[modal.kind]
          }
          onClose={() => setModal(null)}
          wide={["times", "import", "post", "guide"].includes(modal.kind)}
        >
          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}
          {modal.kind === "course" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                task(async () => {
                  const f = Object.fromEntries(new FormData(e.currentTarget)),
                    c = normalize({
                      ...f,
                      id: modal.item?.id || crypto.randomUUID(),
                    });
                  const courses = s.courses.filter((x) => x.id !== c.id);
                  commit({
                    ...s,
                    name: demo ? "我的课表" : s.name,
                    courses: [...courses, c],
                  });
                  setModal(null);
                  notify("课程已保存到本机");
                });
              }}
            >
              <Field label="课程名称">
                <input
                  name="name"
                  defaultValue={modal.item?.name || ""}
                  required
                  maxLength={120}
                  placeholder="例如：高等数学"
                />
              </Field>
              <div className="form-row">
                <Field label="所属校区">
                  <CampusSelect
                    value={
                      modal.item?.campus ||
                      (campus === "all" ? "university" : campus)
                    }
                  />
                </Field>
                <Field label="上课星期">
                  <select name="day" defaultValue={modal.item?.day || day}>
                    {DAYS.map((v, i) => (
                      <option key={v} value={i + 1}>
                        星期{v}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="form-row">
                <Field label="开始节次">
                  <select name="start" defaultValue={modal.item?.start || 1}>
                    {SLOTS.wushan.map((_, i) => (
                      <option key={i} value={i + 1}>
                        第 {i + 1} 节
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="结束节次">
                  <select name="end" defaultValue={modal.item?.end || 2}>
                    {SLOTS.wushan.map((_, i) => (
                      <option key={i} value={i + 1}>
                        第 {i + 1} 节
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field
                label="上课周次"
                hint="支持 1-18、1-17单、2-18双、1-5、7-11 等间断周。"
              >
                <input
                  name="weeks"
                  defaultValue={
                    modal.item?.weeks ? formatWeeks(modal.item.weeks) : "1-18"
                  }
                  required
                />
              </Field>
              <div className="form-row">
                <Field label="上课地点">
                  <input
                    name="room"
                    defaultValue={modal.item?.room || ""}
                    maxLength={100}
                    placeholder="例如：A1-201"
                  />
                </Field>
                <Field label="任课教师">
                  <input
                    name="teacher"
                    maxLength={100}
                    defaultValue={modal.item?.teacher || ""}
                    placeholder="选填"
                  />
                </Field>
              </div>
              <Field label="课程备注">
                <input
                  name="note"
                  maxLength={300}
                  defaultValue={modal.item?.note || ""}
                  placeholder="带上实验报告 / 准备课堂展示…"
                />
              </Field>
              <Field label="课程颜色">
                <div className="color-options">
                  {COLORS.map((color, i) => (
                    <label key={color} style={{ background: color }}>
                      <input
                        type="radio"
                        name="color"
                        value={color}
                        defaultChecked={
                          modal.item?.color
                            ? modal.item.color === color
                            : i === 0
                        }
                        aria-label={"颜色 " + (i + 1)}
                      />
                    </label>
                  ))}
                </div>
              </Field>
              <div className="form-actions">
                {modal.item?.id && (
                  <button
                    type="button"
                    className="danger-text"
                    onClick={() =>
                      task(async () => {
                        commit({
                          ...s,
                          courses: s.courses.filter(
                            (c) => c.id !== modal.item.id,
                          ),
                        });
                        setModal(null);
                        notify("课程已删除");
                      })
                    }
                  >
                    <Trash2 size={16} />
                    删除课程
                  </button>
                )}
                <button className="primary" disabled={busy}>
                  {busy ? "保存中…" : "保存课程"}
                </button>
              </div>
            </form>
          )}
          {modal.kind === "settings" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                task(async () => {
                  const f = Object.fromEntries(new FormData(e.currentTarget));
                  commit({
                    ...s,
                    ...f,
                    totalWeeks: +f.totalWeeks,
                    reminder: +f.reminder,
                  });
                  setWeek(Math.max(1, Math.min(+f.totalWeeks, week)));
                  setModal(null);
                  notify("校历已保存");
                });
              }}
            >
              <p className="form-intro">
                请按当学期教务校历填写。本网站尚未预置经核实的 2026–2027
                学年开学日期。
              </p>
              <Field label="课表名称">
                <input
                  name="name"
                  required
                  maxLength={60}
                  defaultValue={demo ? "我的课表" : s.name}
                />
              </Field>
              <Field
                label="第 1 周周一"
                hint="教学周从这个日期开始计算，与新生报到日可能不同。"
              >
                <input
                  type="date"
                  name="startDate"
                  defaultValue={s.startDate}
                />
              </Field>
              <div className="form-row">
                <Field label="学期总周数">
                  <input
                    name="totalWeeks"
                    type="number"
                    min={1}
                    max={60}
                    defaultValue={s.totalWeeks}
                    required
                  />
                </Field>
                <Field label="日历导出提醒">
                  <select name="reminder" defaultValue={s.reminder}>
                    {[0, 5, 10, 15, 20, 30, 60].map((n) => (
                      <option key={n} value={n}>
                        {n ? "提前 " + n + " 分钟" : "不提醒"}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <p className="form-intro">
                每门课分别使用所属校区的完整 11
                节作息。网页关闭后的提醒，请使用导出到系统日历。
              </p>
              <div className="form-actions">
                <button className="primary" disabled={busy}>
                  保存设置
                </button>
              </div>
            </form>
          )}
          {modal.kind === "times" && (
            <>
              <p className="form-intro">
                两套作息，三个校区。以下为参考时间，以当期教务课表与通知为准。
              </p>
              <div className="table-wrap">
                <table className="times-table">
                  <thead>
                    <tr>
                      <th>节次</th>
                      <th>五山校区</th>
                      <th>大学城 / 广州国际</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.wushan.map((slot, i) => (
                      <tr
                        className={i === 4 || i === 8 ? "separate" : ""}
                        key={i}
                      >
                        <td>第 {i + 1} 节</td>
                        <td>{slot.replace("-", "–")}</td>
                        <td>{SLOTS.university[i].replace("-", "–")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="form-intro">
                资料核对：2026-10-22。
                <a
                  href="https://go.scut.me/life/time/wushan"
                  target="_blank"
                  rel="noreferrer"
                >
                  五山时间
                </a>{" "}
                ·{" "}
                <a
                  href="https://go.scut.me/life/time/hemc_gzic"
                  target="_blank"
                  rel="noreferrer"
                >
                  大学城 / 国际时间
                </a>
                （学生维护手册）；
                <a
                  href="https://scut.wiki/life/"
                  target="_blank"
                  rel="noreferrer"
                >
                  交叉参考
                </a>
                。学校旧作息 PDF 当前链接失效。
              </p>
            </>
          )}
          {modal.kind === "import" && (
            <>
              <p className="form-intro">
                在浏览器中读取，课表原文件不会上传。支持华工教务文字版
                PDF、CSV、XLSX、标准七列表格 HTML 和本站 JSON
                备份；不支持截图、扫描 PDF 或 WakeUp 私有口令。
              </p>
              <Field label="未标明校区的课程，统一使用">
                <CampusSelect
                  value={importCampus}
                  onChange={(e) => {
                    setImportCampus(e.target.value);
                    setPreview(null);
                  }}
                />
              </Field>
              <label className="upload-zone">
                <Upload size={28} />
                <strong>{busy ? "正在读取，请稍候…" : "选择课表文件"}</strong>
                <small>最大 12 MB · 导入后先预览再保存</small>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.csv,.xlsx,.html,.htm,.json"
                  disabled={busy}
                  onChange={(e) => readFile(e.target.files[0])}
                />
              </label>
              <button
                className="text-button"
                onClick={() =>
                  saveFile(
                    "木棉里课表模板.csv",
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
                        [
                          "示例课程",
                          1,
                          1,
                          2,
                          "示例教师",
                          "教学楼101",
                          "1-18",
                          "大学城校区",
                        ],
                      ]),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download size={15} />
                下载 CSV 填写模板
              </button>
              {preview && (
                <div className="import-preview">
                  <h3>识别到 {preview.courses.length} 个上课时段</h3>
                  <p>
                    逐项核对课程、周次和校区；确认后会替换本机当前课表，请先导出旧课表备份。
                  </p>
                  <div className="preview-list">
                    {preview.courses.map((c, i) => (
                      <div key={i}>
                        <strong>{c.name}</strong>
                        <span>
                          周{DAYS[c.day - 1]} · {c.start}–{c.end} 节 ·{" "}
                          {CAMPUSES[c.campus]}
                        </span>
                        <small>
                          {formatWeeks(c.weeks)} 周 · {c.room || "教室待定"}
                        </small>
                      </div>
                    ))}
                  </div>
                  {preview.notes?.map((n, i) => (
                    <p key={i}>{n}</p>
                  ))}
                  <div className="form-actions">
                    <button
                      className="secondary"
                      onClick={() => exportAction("json")}
                    >
                      备份旧课表
                    </button>
                    <button
                      className="primary"
                      disabled={busy}
                      onClick={() =>
                        task(async () => {
                          commit(
                            validate({
                              ...preview,
                              totalWeeks: Math.max(
                                preview.totalWeeks || 22,
                                ...preview.courses.flatMap((c) => c.weeks),
                              ),
                            }),
                          );
                          setWeek(1);
                          setModal(null);
                          notify("课表已导入，请核对校历和上课时间");
                        })
                      }
                    >
                      确认导入
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {modal.kind === "export" && (
            <div className="export-options">
              {[
                [
                  "ics",
                  "日历文件",
                  "带校区时间、停补课与提醒，导入系统日历。",
                  CalendarDays,
                ],
                [
                  "json",
                  "完整备份",
                  "保存课程、校历、周次与调课，便于换设备。",
                  Download,
                ],
                [
                  "csv",
                  "表格文件",
                  "含校区列，可用 Excel / WPS 编辑。",
                  BookOpen,
                ],
              ].map(([kind, title, description, Icon]) => (
                <button key={kind} onClick={() => exportAction(kind)}>
                  <Icon size={23} />
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              ))}
            </div>
          )}
          {modal.kind === "adjust" && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  task(async () => {
                    if (!s.startDate) throw Error("请先设置校历第 1 周周一");
                    const f = Object.fromEntries(new FormData(e.currentTarget));
                    if (f.kind === "copy") {
                      if (!f.source) throw Error("请选择要补上的原上课日期");
                      if (f.source === f.date)
                        throw Error("补课日期不能与原日期相同");
                      const w = weekOf(s, f.source);
                      if (w < 1 || w > s.totalWeeks)
                        throw Error("原上课日期必须在学期内");
                    }
                    commit({
                      ...s,
                      adjustments: {
                        ...s.adjustments,
                        [f.date]: f.kind === "off" ? null : f.source,
                      },
                    });
                    notify("调课安排已保存");
                    setModal(null);
                  });
                }}
              >
                <p className="form-intro">
                  这里只调整你的个人课表，不会向学校提交调课申请。补课按原日期的课程计算，目标日期原有课程会被替换；原日期若停课，请另加一条停课。
                </p>
                <Field label="调整日期">
                  <input name="date" type="date" required />
                </Field>
                <Field label="调整方式">
                  <select name="kind">
                    <option value="off">这一天停课</option>
                    <option value="copy">补上另一天的课程</option>
                  </select>
                </Field>
                <Field label="补课原上课日期（停课时不用填写）">
                  <input name="source" type="date" />
                </Field>
                <div className="form-actions">
                  <button className="primary" disabled={busy}>
                    保存安排
                  </button>
                </div>
              </form>
              {Object.entries(s.adjustments).length > 0 && (
                <div className="adjustments">
                  <h3>已有安排</h3>
                  {Object.entries(s.adjustments)
                    .sort()
                    .map(([d, source]) => (
                      <div key={d}>
                        <span>
                          {d}：{source ? "补 " + source + " 的课" : "停课"}
                        </span>
                        <button
                          className="icon-btn"
                          aria-label={"删除 " + d + " 调整"}
                          onClick={() =>
                            task(async () => {
                              const a = { ...s.adjustments };
                              delete a[d];
                              commit({ ...s, adjustments: a });
                              notify("已恢复原课表");
                            })
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </>
          )}
          {["login", "register", "recover"].includes(modal.kind) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                task(async () => {
                  const r = await api(modal.kind, { method: "POST", data: f });
                  if (modal.kind === "recover") {
                    setUser(null);
                    open("recovery", { code: r.recoveryCode, recovered: true });
                  } else {
                    setUser(r.user);
                    if (r.recoveryCode)
                      open("recovery", { code: r.recoveryCode });
                    else {
                      setModal(null);
                      notify("欢迎回来，" + r.user.nickname);
                    }
                  }
                });
              }}
            >
              <p className="form-intro">
                课表无需登录即可使用。登录后，可以发布动态、评论和收藏。
              </p>
              {modal.kind === "register" && (
                <Field label="公开昵称">
                  <input
                    name="nickname"
                    minLength={2}
                    maxLength={20}
                    required
                    autoComplete="nickname"
                    placeholder="想让同学怎么称呼你？"
                  />
                </Field>
              )}
              <Field label="登录邮箱">
                <input
                  name="email"
                  type="email"
                  maxLength={254}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </Field>
              {modal.kind === "recover" && (
                <Field label="账号恢复码">
                  <input
                    name="code"
                    required
                    pattern="[a-f0-9]{48}"
                    autoComplete="off"
                    placeholder="注册时保存的 48 位恢复码"
                  />
                </Field>
              )}
              <Field
                label={modal.kind === "recover" ? "设置新密码" : "密码"}
                hint="至少 10 位；建议使用独立密码。"
              >
                <input
                  name="password"
                  type="password"
                  minLength={10}
                  maxLength={128}
                  required
                  autoComplete={
                    modal.kind === "login" ? "current-password" : "new-password"
                  }
                />
              </Field>
              {modal.kind === "register" && (
                <p className="form-intro">
                  注册即同意社区约定。邮箱作为登录账号，当前不发送验证邮件，也不代表学校身份认证；注册后请保存恢复码。
                </p>
              )}
              <button className="primary full" disabled={busy}>
                {busy
                  ? "正在处理…"
                  : modal.kind === "login"
                    ? "登录"
                    : modal.kind === "register"
                      ? "创建账号"
                      : "重置密码"}
              </button>
              <div className="auth-links">
                <button
                  type="button"
                  onClick={() =>
                    open(modal.kind === "register" ? "login" : "register")
                  }
                >
                  {modal.kind === "register"
                    ? "已有账号？去登录"
                    : "还没有账号？注册"}
                </button>
                {modal.kind !== "recover" && (
                  <button type="button" onClick={() => open("recover")}>
                    忘记密码
                  </button>
                )}
                {modal.kind === "recover" && (
                  <button type="button" onClick={() => open("login")}>
                    返回登录
                  </button>
                )}
              </div>
            </form>
          )}
          {modal.kind === "recovery" && (
            <div className="recovery-box">
              <ShieldCheck size={39} />
              <h3>
                {modal.item.recovered
                  ? "密码已重置，请保存新的恢复码"
                  : "账号已创建，请保存恢复码"}
              </h3>
              <p>
                忘记密码时，用邮箱和此恢复码重置密码。恢复码只在此处显示；重置后旧码失效。
              </p>
              <code>{modal.item.code}</code>
              <button
                className="secondary"
                onClick={() =>
                  saveFile(
                    "木棉里账号恢复码.txt",
                    "木棉里账号恢复码\n" +
                      modal.item.code +
                      "\n请妥善保管，不要公开分享。",
                  )
                }
              >
                <Download size={16} />
                下载保存
              </button>
              <button
                className="primary full"
                onClick={() => {
                  if (modal.item.recovered) open("login");
                  else setModal(null);
                }}
              >
                我已保存，继续
              </button>
            </div>
          )}
          {modal.kind === "profile" && user && (
            <>
              <div className="profile-detail">
                <span className="avatar">{user.nickname.slice(0, 1)}</span>
                <div>
                  <h3>{user.nickname}</h3>
                  <p>{user.email}</p>
                  <small>邮箱尚未验证 · 非学校认证账号</small>
                </div>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = Object.fromEntries(new FormData(e.currentTarget));
                  task(async () => {
                    const r = await api("profile", {
                      method: "PATCH",
                      data: f,
                    });
                    setUser(r.user);
                    setModal(null);
                    notify("昵称已更新");
                  });
                }}
              >
                <Field label="修改公开昵称">
                  <input
                    name="nickname"
                    minLength={2}
                    maxLength={20}
                    required
                    defaultValue={user.nickname}
                  />
                </Field>
                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() =>
                      task(async () => {
                        await api("logout", { method: "POST" });
                        setUser(null);
                        setScope("all");
                        setModal(null);
                        notify("已退出登录");
                      })
                    }
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                  <button className="primary" disabled={busy}>
                    保存昵称
                  </button>
                </div>
              </form>
            </>
          )}
          {modal.kind === "compose" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                task(async () => {
                  await api(modal.item ? "posts/" + modal.item.id : "posts", {
                    method: modal.item ? "PATCH" : "POST",
                    data: {
                      ...f,
                      image: image || modal.item?.image || null,
                      status: modal.item?.status || "open",
                    },
                  });
                  setModal(null);
                  setPage(0);
                  setScope("all");
                  setCategory("全部");
                  setCampus("all");
                  setSearch("");
                  loadPosts();
                  notify(
                    modal.item
                      ? "动态已更新"
                      : "动态已发布，其他同学现在可以看到了",
                  );
                });
              }}
            >
              <div className="form-row">
                <Field label="发布校区">
                  <CampusSelect
                    value={
                      modal.item?.campus ||
                      (campus === "all" ? "university" : campus)
                    }
                  />
                </Field>
                <Field label="动态分类">
                  <select
                    name="category"
                    defaultValue={
                      modal.item?.category ||
                      (category === "全部" ? "日常分享" : category)
                    }
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="标题">
                <input
                  name="title"
                  minLength={2}
                  maxLength={80}
                  required
                  defaultValue={modal.item?.title || ""}
                  placeholder="用一句话，说说你想分享的事"
                />
              </Field>
              <Field label="内容">
                <textarea
                  name="content"
                  minLength={2}
                  maxLength={3000}
                  rows={6}
                  required
                  defaultValue={modal.item?.content || ""}
                  placeholder="写下细节，让同学更容易了解你。请勿公开他人的联系方式、学号或证件信息。"
                />
              </Field>
              <Field label="相关地点（选填）">
                <input
                  name="location"
                  maxLength={80}
                  defaultValue={modal.item?.location || ""}
                  placeholder="例如：图书馆、A1 教学楼"
                />
              </Field>
              <div className="image-upload-row">
                <label className="secondary">
                  <ImagePlus size={17} />
                  {busy ? "图片处理中…" : "添加图片"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={busy}
                    onChange={(e) => uploadPicture(e.target.files[0])}
                  />
                </label>
                <small>最多 1 张 · 自动缩小并去除照片元数据</small>
              </div>
              {(image || modal.item?.image) && (
                <img
                  className="upload-preview"
                  src={"/api/images/" + (image || modal.item.image)}
                  alt="待发布图片预览"
                />
              )}
              <p className="form-intro">
                以昵称「{user?.nickname}」公开发布。失物证件请先遮挡敏感信息。
              </p>
              <div className="form-actions">
                <button className="primary" disabled={busy}>
                  {busy ? "处理中…" : modal.item ? "保存修改" : "发布动态"}
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}
          {modal.kind === "post" && (
            <>
              <div className="post-detail">
                <div className="post-meta">
                  <span className="avatar">
                    {modal.item.author.slice(0, 1)}
                  </span>
                  <div>
                    <strong>{modal.item.author}</strong>
                    <small>
                      {CAMPUSES[modal.item.campus]} ·{" "}
                      {new Date(modal.item.created).toLocaleString("zh-CN", {
                        timeZone: "Asia/Shanghai",
                      })}
                    </small>
                  </div>
                  <span className="tag">{modal.item.category}</span>
                </div>
                <h2>
                  {modal.item.title}
                  {modal.item.status === "resolved" && (
                    <span className="resolved">已解决</span>
                  )}
                </h2>
                <p>{modal.item.content}</p>
                {modal.item.image && (
                  <img
                    className="detail-image"
                    src={"/api/images/" + modal.item.image}
                    alt={modal.item.title + "的配图"}
                  />
                )}{" "}
                {modal.item.location && (
                  <span className="post-location">
                    <MapPin size={15} />
                    {modal.item.location}
                  </span>
                )}
                <div className="detail-actions">
                  <button
                    className="secondary"
                    onClick={() => reaction(modal.item, "like")}
                  >
                    <Heart size={16} />
                    {modal.item.liked ? "已赞同" : "赞同"} {modal.item.likes}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => reaction(modal.item, "save")}
                  >
                    <Bookmark size={16} />
                    {modal.item.saved ? "已收藏" : "收藏"}
                  </button>
                  {!!modal.item.mine && (
                    <>
                      <button
                        className="text-button"
                        onClick={() => open("compose", modal.item)}
                      >
                        编辑
                      </button>
                      <button
                        className="text-button"
                        onClick={() =>
                          task(async () => {
                            await api("posts/" + modal.item.id, {
                              method: "PATCH",
                              data: {
                                ...modal.item,
                                status:
                                  modal.item.status === "resolved"
                                    ? "open"
                                    : "resolved",
                              },
                            });
                            setModal(null);
                            loadPosts();
                            notify("状态已更新");
                          })
                        }
                      >
                        {modal.item.status === "resolved"
                          ? "重新打开"
                          : "标记已解决"}
                      </button>
                      <button
                        className="danger-text"
                        onClick={() => open("delete-post", modal.item)}
                      >
                        撤回
                      </button>
                    </>
                  )}
                </div>
              </div>
              <section className="comments">
                <h3>评论 · {comments.length}</h3>
                {commentError && <p className="error-box">{commentError}</p>}
                {comments.map((c) => (
                  <article key={c.id}>
                    <span className="avatar small">{c.author.slice(0, 1)}</span>
                    <div>
                      <strong>{c.author}</strong>
                      <p>{c.content}</p>
                      <small>
                        {new Date(c.created).toLocaleString("zh-CN", {
                          timeZone: "Asia/Shanghai",
                        })}
                      </small>
                    </div>
                    {!!c.mine && (
                      <button
                        className="icon-btn"
                        aria-label="删除我的评论"
                        onClick={() =>
                          task(async () => {
                            await api("comments/" + c.id, { method: "DELETE" });
                            setComments((old) =>
                              old.filter((x) => x.id !== c.id),
                            );
                            loadPosts();
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </article>
                ))}
                {user ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.currentTarget,
                        content = new FormData(form).get("content");
                      task(async () => {
                        await api("posts/" + modal.item.id + "/comments", {
                          method: "POST",
                          data: { content },
                        });
                        const r = await api(
                          "posts/" + modal.item.id + "/comments",
                        );
                        setComments(r.comments);
                        form.reset();
                        loadPosts();
                      });
                    }}
                  >
                    <textarea
                      name="content"
                      required
                      maxLength={500}
                      rows={2}
                      placeholder="友善地聊两句…"
                    />
                    <div className="form-actions">
                      <button className="primary" disabled={busy}>
                        发表回复
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    className="secondary full"
                    onClick={() => open("login")}
                  >
                    登录后参与讨论
                  </button>
                )}
              </section>
            </>
          )}
          {modal.kind === "delete-post" && (
            <>
              <p className="form-intro">
                撤回后，动态、评论和收藏记录会被删除。确定撤回「
                {modal.item.title}」吗？
              </p>
              <div className="form-actions">
                <button
                  className="secondary"
                  onClick={() => showPost(modal.item)}
                >
                  保留动态
                </button>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() =>
                    task(async () => {
                      await api("posts/" + modal.item.id, { method: "DELETE" });
                      setModal(null);
                      loadPosts();
                      notify("动态已撤回");
                    })
                  }
                >
                  确认撤回
                </button>
              </div>
            </>
          )}
          {modal.kind === "report" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = Object.fromEntries(new FormData(e.currentTarget));
                task(async () => {
                  await api("posts/" + modal.item.id + "/report", {
                    method: "POST",
                    data: f,
                  });
                  setModal(null);
                  notify("举报已提交，等待站主管理处理");
                });
              }}
            >
              <p className="form-intro">
                请描述具体问题，举报内容只对管理员可见。
              </p>
              <Field label="举报原因">
                <textarea
                  name="reason"
                  required
                  minLength={2}
                  maxLength={300}
                  rows={4}
                  placeholder="例如：泄露他人隐私、广告刷屏、虚假信息…"
                />
              </Field>
              <div className="form-actions">
                <button className="primary" disabled={busy}>
                  提交举报
                </button>
              </div>
            </form>
          )}
          {modal.kind === "rules" && (
            <div className="prose">
              <h3>友善，是这里的默认设置。</h3>
              <p>
                欢迎分享校园日常、学习经验、活动邀约和寻物信息。请尊重每位同学，避免人身攻击与无依据的指责。
              </p>
              <h3>把隐私留给本人。</h3>
              <p>
                不要公开他人的学号、电话、住址、证件照片或私聊截图。拾到校园卡、身份证时，请遮挡敏感信息并优先交给官方服务点。
              </p>
              <h3>让信息真实、有用。</h3>
              <p>
                请勿发布诈骗、广告刷屏或冒充学校官方的内容。闲置交换仅作信息交流，交易由双方自行核实。事情解决后，记得标记“已解决”。
              </p>
              <h3>遇到问题，可以举报。</h3>
              <p>
                帖子卡片右下角旗帜可提交举报。作者可编辑或撤回自己的动态，管理员可处理举报与下架内容。
              </p>
              <p className="form-intro">
                本网站是独立学生项目，不代表华南理工大学。登录邮箱尚未验证，昵称不能作为在校身份的证明。
              </p>
            </div>
          )}
          {modal.kind === "guide" && (
            <div className="prose">
              <h3>木棉里，把华园日常串起来。</h3>
              <p>
                连接五山、大学城与广州国际校区，提供个人课表与共享校园墙。独立学生项目，非学校官方服务。
              </p>
              <div className="guide-grid">
                <div>
                  <CalendarDays size={24} />
                  <h3>安排好每一节课</h3>
                  <p>
                    先设置校历，再导入或添加课程。每门课可以选择不同校区，支持单双周、间断周、停课与补课。本机课表不会自动上传，换设备请导出
                    JSON 备份。
                  </p>
                </div>
                <div>
                  <MessagesSquare size={24} />
                  <h3>分享每一段日常</h3>
                  <p>
                    邮箱密码注册，昵称公开展示。帖子与评论保存在在线数据库，跨设备共享；课表无需登录也能使用。
                  </p>
                </div>
              </div>
              <h3>常用官方入口</h3>
              <div className="official-links">
                {[
                  ["统一门户", "https://my.scut.edu.cn/up/"],
                  ["教务处 / 校历", "https://jw.scut.edu.cn/"],
                  ["校园地图", "https://map.scut.edu.cn/"],
                  [
                    "国际校区交通",
                    "https://www2.scut.edu.cn/gzic/2021/1025/c30320a448333/page.htm",
                  ],
                  ["师生服务中心", "https://fssc.scut.edu.cn/"],
                ].map(([name, url]) => (
                  <a href={url} key={name} target="_blank" rel="noreferrer">
                    {name}
                    <ArrowUpRight size={15} />
                  </a>
                ))}
              </div>
              <h3>来源与边界</h3>
              <p>
                2026-10-22 进行了超过 30
                分钟资料调研。三校区作息参考学校公开资料索引，并与{" "}
                <a
                  href="https://go.scut.me/life/time/wushan"
                  target="_blank"
                  rel="noreferrer"
                >
                  华南理工生存手册
                </a>
                、
                <a
                  href="https://scut.wiki/life/"
                  target="_blank"
                  rel="noreferrer"
                >
                  华工手册
                </a>
                交叉核对。旧学校 PDF 链接部分失效，以当期教务安排为准；2026–2027
                学年开学日期未预置。
              </p>
              <p>
                课表解析部分复用 MIT 许可的{" "}
                <a
                  href="https://github.com/KevinKaslana093/keyu-timetable"
                  target="_blank"
                  rel="noreferrer"
                >
                  课屿
                </a>
                。导入不保证兼容所有教务布局，扫描件与图片尚不支持。示例课程均为虚构。
              </p>
              <p>
                当前不发送邮箱验证或找回邮件，请妥善保存注册恢复码。课表文件仅在浏览器中读取；校园墙文字与配图在确认发布后公开，配图选择后会先上传以供预览。
              </p>
            </div>
          )}
          {modal.kind === "admin" && (
            <>
              <p className="form-intro">
                站主使用单独的管理密钥处理举报。密钥不会保存在本机或公开仓库。
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  task(async () => {
                    const r = await api("admin/reports", {
                      method: "POST",
                      adminKey,
                    });
                    setReports(r.reports);
                  });
                }}
              >
                <Field label="管理密钥">
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    required
                    autoComplete="off"
                  />
                </Field>
                <button className="primary" disabled={busy}>
                  查看举报
                </button>
              </form>
              <div className="report-list">
                {reports.map((r) => (
                  <article key={r.id}>
                    <strong>{r.title}</strong>
                    <p>{r.reason}</p>
                    <small>
                      {r.handled ? "已处理" : "待处理"} ·{" "}
                      {r.hidden ? "帖子已隐藏" : "帖子可见"}
                    </small>
                    <div>
                      <button
                        className="secondary"
                        onClick={() =>
                          task(async () => {
                            await api("admin/moderate", {
                              method: "POST",
                              adminKey,
                              data: {
                                postId: r.post_id,
                                reportId: r.id,
                                hidden: !r.hidden,
                              },
                            });
                            const result = await api("admin/reports", {
                              method: "POST",
                              adminKey,
                            });
                            setReports(result.reports);
                            loadPosts();
                          })
                        }
                      >
                        {r.hidden ? "恢复显示" : "下架帖子"}
                      </button>
                      <button
                        className="text-button"
                        onClick={() =>
                          task(async () => {
                            await api("admin/moderate", {
                              method: "POST",
                              adminKey,
                              data: {
                                postId: r.post_id,
                                reportId: r.id,
                                hidden: !!r.hidden,
                              },
                            });
                            const result = await api("admin/reports", {
                              method: "POST",
                              adminKey,
                            });
                            setReports(result.reports);
                          })
                        }
                      >
                        标记已处理
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
