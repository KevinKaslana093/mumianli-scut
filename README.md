# 木棉里 · 华工课表与校园墙

面向华南理工大学五山、大学城和广州国际校区的课表工具与学生交流空间。独立学生项目，非学校官方服务。

## 在线使用

- [打开木棉里](https://mumianli-scut-campus-2026.memily7.chatgpt.site)
- [GitHub 源码](https://github.com/KevinKaslana093/mumianli-scut)

课表无需登录。校园墙使用邮箱和密码注册，自选昵称展示；帖子、评论、收藏跨设备共享。

## 已提供的功能

- 三校区各 11 节参考作息，兼容第 12–16 节课程；超出预设的实际时间可手动填写，确认后可导出日历。每门课独立选择校区，按实际时钟时间检查冲突。
- 周视图、手机日视图、教学周切换；单双周、间断周、手动增删改。
- 华工教务文字版 PDF、标准 CSV / XLSX / HTML、JSON 备份导入；先预览，再确认保存。
- 自定义第 1 周周一与学期周数；指定日期停课、补课；UTC+8 系统日历与提醒导出。
- 校园墙校区 / 分类 / 关键词筛选、最新 / 热门、发帖配图、评论、点赞与收藏。
- 作者编辑、撤回、标记已解决；举报与站主管理。
- 邮箱密码账号、scrypt 密码哈希、HttpOnly 会话、单次恢复码找回。

## 数据与适用范围

课表原文件在浏览器内解析，课表保存在本机，不自动上传。跨设备转移课表请导出 JSON 备份。校园墙文字与图片保存在 Cloudflare D1 / R2；应用由 Sites 托管，源码保存在 GitHub。GitHub Pages 本身不运行数据库或服务端账号接口。

当前邮箱作为登录账号，**尚未接入邮箱验证或找回邮件**，也不代表在校身份认证。注册后请保存恢复码；重置密码后恢复码与旧会话失效。管理密钥通过运行环境注入，不在公开仓库；站主在页脚“管理入口”处理举报。

2026–2027 学年第一教学周尚未可靠确认，因此请按教务处校历设置开学日期。作息为参考预设，以最新官方课表为准。旧学校作息 PDF 部分失效，现有来源及调研记录见 [研究记录](docs/RESEARCH.md)。文字 PDF 解析不保证兼容所有教务布局；不支持扫描件、截图 OCR、WakeUp 私有口令。示例课程均为虚构。

## 本地开发

Node.js 22.13+：

```sh
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_shiny_brood.sql
npm run dev
```

本地 `.dev.vars` 可设置 `ADMIN_KEY`，用于测试管理界面，切勿提交。生产变量通过 Sites 管理。首次部署通过 `.openai/hosting.json` 连接 D1 和 R2；表结构由 `db/schema.ts` 生成迁移，生产迁移由发布流程执行。当前项目的原始首次迁移不可在部署后改写。

## 验证

```sh
node --test tests/timetable.test.mjs
# 本地服务启动后，仅对本地测试数据库运行：
node tests/api-smoke.mjs
```

`tests/admin-smoke.mjs` 需要本地测试举报和 `.dev.vars` 管理密钥。完整已测范围与限制见 [验证记录](docs/VALIDATION.md)。

## 许可

应用代码 MIT。课表解析部分改编自 [课屿](https://github.com/KevinKaslana093/keyu-timetable)，保留 [原许可](lib/KEYU-LICENSE.txt)。PDF.js 为 Apache-2.0，字体与字符映射遵循各自附带许可证；read-excel-file、@noble/hashes 及其他依赖遵循各自许可。原始第三方资产保留许可文本。
