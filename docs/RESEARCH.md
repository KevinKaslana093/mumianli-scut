# 华工课表与校园墙：调研工作记录

调研开始：2026-10-22 18:49:27（北京时间）。用户要求调研至少 30 分钟后才开始实施；在 19:19:27 前不初始化网站、不编写应用、不创建线上项目。

调研结束：2026-10-22 19:21:15（北京时间），历时 **31 分 48 秒**。之后才初始化应用与线上项目。

实施确认：用户最终明确要求邮箱与密码注册登录，已采用独立账号，不要求访客拥有 GitHub 或 ChatGPT 账号；共享数据库采用 D1、配图采用 R2，源码另推送用户的 GitHub 仓库。当前不发送验证邮件，找回使用注册时提供的单次恢复码。

## 已确认的用户选择

- 两个核心功能：华南理工大学五山、大学城、广州国际三个校区的课表与时间安排；校园墙。
- 校园墙供同学共同使用，帖子跨设备共享。
- 源码发布到已有授权的 GitHub 账号 KevinKaslana093。
- 独立数据库，优先普通校园社区体验，不使用 GitHub Issues 作为发帖入口。

## 课表事实与来源

1. 学校体育学院公开 PDF 的搜索索引包含三校区完整作息表，但两条原文件链接当前直接读取均返回 404。不可声称已下载或完整阅读原 PDF。
   - https://www2.scut.edu.cn/_upload/article/files/8d/32/1dbbcf9a47729b8e2b85e4c02e01/a25ee229-19e8-4f09-afd5-3ea70b02bec6.pdf
   - https://www2.scut.edu.cn/_upload/article/files/b0/a3/844b5a4049cb8df1fb8f0f6a7ed0/fc580c25-a43a-4a0b-9b34-07ec0a4fdeb3.pdf
2. 学生维护的华南理工生存手册可直接读取，交叉验证完整 11 节时间：
   - https://go.scut.me/life/time/wushan
   - https://go.scut.me/life/time/hemc_gzic
3. 五山：08:00–08:45、08:55–09:40、10:00–10:45、10:55–11:40、14:30–15:15、15:25–16:10、16:20–17:05、17:15–18:00、19:00–19:45、19:55–20:40、20:50–21:35。
4. 大学城/广州国际：08:50–09:35、09:40–10:25、10:40–11:25、11:30–12:15、14:00–14:45、14:50–15:35、15:45–16:30、16:35–17:20；晚课三节与五山相同。
5. 未可靠确认 2026–2027 学年第一教学周。可检索往年专业课表附校历，但不能把往年日期顺延作为本学年官方校历。让用户设置第 1 周周一；示例日期与真实校历区分。
6. 学校教务处首页当前浏览抓取返回 403。官方学校首页可核验教务、统一门户、校园地图入口。
   - https://www.scut.edu.cn/new/241/list.htm
   - https://jw.scut.edu.cn/
   - https://my.scut.edu.cn/up/
   - https://map.scut.edu.cn/
7. 社区手册教务入口说明：https://scut.wiki/study/ 。官方入口不等于可从第三方网页直接读取课表；网站不收集学校密码，不冒充自动教务同步。
8. 三校区时间不应只作为界面整体主题：每门课保留 campus，详情显示该课程的实际起止时间；跨校区冲突按时钟时间判断。

## 出行与时间安排

- 官方交通页：https://www2.scut.edu.cn/gzic/2021/1025/c30320a448333/page.htm 。区分学生与教工班车，要求 GZIC 智慧服务预约。
- 官方学生班车页：https://www2.scut.edu.cn/gzic/2021/1027/c30320a448941/page.htm 。当前正文仍标 2026 春季学期，不能宣称为 2026 秋季实时车表。
- 教工班车：https://www2.scut.edu.cn/gzic/2021/1027/c30320a448926/page.htm 。不将教工线路直接包装成普通学生可预约线路。
- 取舍：提供官方入口；跨校区连续课程显示间隔分钟与出行提醒，不编造交通耗时，不声称实时到站。

## 竞品功能研究

### WakeUp（产品官方文档）

- https://www.wakeup.fun/
- https://www.wakeup.fun/doc/main_interface.html
- https://www.wakeup.fun/doc/add_course.html
- https://www.wakeup.fun/doc/settings/schedule_settings.html
- https://www.wakeup.fun/doc/import_schedule.html
- https://www.wakeup.fun/doc/import_from_csv.html
- https://www.wakeup.fun/doc/import_from_eas.html

结论：周数跳转与回本周；课程可有多个时段；课程重叠不能静默覆盖；学期开始日期影响单双周；导入必须核对；可通过本地文件导入避免处理学校凭据。七列 CSV 为课程名称、星期、开始节数、结束节数、老师、地点、周数。周数支持区间、单双周、顿号分隔间断周。

### 超级课程表（产品官网）

- https://cx.super.cn/

课表与校园动态、社团活动、跳蚤市场可以互补；本项目保持两个主入口，避免加入成绩查询等没有真实接口的按钮。

### 华工导出工具（作者发布页）

- https://greasyfork.org/mr/scripts/580326-scut-lesson-table

显示学生有多格式导出与不连续周次需求；不复制其 GPL 源码，不要求安装脚本作为本项目必要步骤。

### 用户已有课屿项目

- https://github.com/KevinKaslana093/keyu-timetable

MIT 项目已有 PDF / HTML / CSV / XLSX 导入、周次计算、校园时间与日历导出。可在实施阶段评估复用纯解析模块并保留许可，不能把已有项目测试当作新网站验证。课屿的学校账号导入仍有真实设备验证限制，网站不宣称沿用后就自动成功。

## 校园墙功能研究

- 超级课程表校园动态：日常、社团、闲置。
- 国科大服务大厅 https://service.ucas.ac.cn/ ：失物招领与二手信息分开，提供报失/招领及求购/出售。
- 上海交大官方失物招领介绍 https://xygl.sjtu.edu.cn/?id=ED5BD52B46D0A443E26401FED71161D7&m=module_g_article.ui_portal.detail ：信息发布、认领与认证具有独立流程。
- 华工国际校区官方社区服务 https://www2.scut.edu.cn/gzic/30318/list.htm ：学校真实服务入口与学生自发社区应区分。
- https://www.sycm.edu.cn/display_son.aspx?DWid=33&Nid=30808&Vid=-1 ：学生工作部门对于校园墙公开他人隐私的提醒；产品需明确非官方，提供举报、本人撤回，避免展示账号邮箱与学号。

第一版建议：昵称发布、校区与分类筛选、全文搜索、最新/热门、详情与评论、点赞收藏、我的发布、本人编辑/删除/标记已解决、举报及站主管理。空数据库显示真实空状态；若提供示例，明确为演示且不伪造真实学生活动/人数。

## 发布、数据与交互研究

- GitHub Pages 官方说明：https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages 。只运行静态网页，不能单独提供数据库和服务端写入授权。
- Sites 可提供 Cloudflare Worker + D1 数据库；源码同时发布 GitHub。公开浏览与写操作授权分开；保留平台登录，不自行假造学校统一认证。
- W3C 触控目标：https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html 。小屏使用足够大小与间距的按钮。
- W3C 重排：https://www.w3.org/WAI/WCAG22/Understanding/reflow.html 。普通内容适应窄屏；课表可提供日视图与周视图，避免整页横向溢出。
- MDN 通知：https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API/Using_the_Notifications_API 。网页通知有权限及移动端限制；课表提醒优先通过 ICS 导出至系统日历，不承诺关闭网页后后台定时提醒。

## 待完成的调研

- 复核校历证据与公开作息来源可达性。
- 调查校园墙发布后管理、分类及冷启动体验。
- 调研本地导入文件的错误提示与校区映射。
- 核实独立数据库部署与公开浏览/登录写入方式。
- 19:19:27 后记录真实调研结束时间，再开始应用实施。

## 最后一轮补充

- 官方学院登录说明已直接读取：https://www2.scut.edu.cn/design/_t2289/2024/0625/c2818a557524/page.psp 。校外访问教务需要学校 VPN；因此不在网站内收集统一认证凭据。
- 2025 本科生手册可读取，共 276 页；检索中没有发现作息时间表或本学年校历，不能以它证明 2026–2027 开学日期。
  https://www2.scut.edu.cn/_upload/article/files/d3/78/8cde8c77459587f668af8f5e285f/e994291c-9e8e-4336-9a79-69982eb7ee30.pdf
- WakeUp 导出说明：https://www.wakeup.fun/doc/export_schedule.html 。日历导出可以携带提醒，适合作为网页关闭后的提醒入口。
- iCalendar 标准：https://www.rfc-editor.org/info/rfc5545/ 。本项目应使用明确 UTC+8 转换的时间，不依赖浏览器所在时区；间断周、停课、补课逐次展开能降低导出歧义。
- W3C 弹窗：https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ 。弹窗进入时聚焦，限制 Tab 范围，Esc 退出并恢复触发按钮焦点。
- Cloudflare D1 文档 https://developers.cloudflare.com/d1/ 、参数绑定 https://developers.cloudflare.com/d1/worker-api/prepared-statements/ 、索引 https://developers.cloudflare.com/d1/best-practices/use-indexes/ 。共享记录保存在云端，写操作服务端鉴权，帖子分页、按校区/分类/时间索引；点赞去重。
- 图片存储 https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ 。发帖图片走受控上传与服务端大小/类型验证；撤回内容后图片不应继续通过公开帖子接口访问。
- 不把浏览器 localStorage 作为共享数据库；本地课表保存失败应明确提示并可导出备份。
- 查询存在可达性差异：生存手册 HTML 曾读取成功，后续部分请求失败；报告保留真实状态，不将一次成功读取包装成长期可达承诺。

## 验收计划（研究产出，尚非测试结果）

1. 验证三校区完整 11 节起止时间，尤其五山早八与南部校区 08:50、两套下午课时间差。
2. 验证单双周、间断周、跨校区实际时钟冲突、学期前/后、日期覆盖与 UTC+8 日历导出。
3. 验证导入预览、坏文件、行错误、保留原数据及本地保存失败反馈。
4. 验证匿名公开读取、登录写入、本人修改、他人不能修改、重复点赞与举报记录。
5. 用两个独立浏览器会话确认帖子与评论来自同一云端数据源。
6. 检查桌面、小屏、键盘导航、错误与空状态；发布后核验在线 URL、静态资源和 API。
