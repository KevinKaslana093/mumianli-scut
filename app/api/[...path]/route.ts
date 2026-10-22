import { env } from "cloudflare:workers";
import { z } from "zod";
import {
  ApiError,
  db,
  getUser,
  hashPassword,
  verify,
  makeSession,
  cookie,
  digest,
  rate,
  randomToken,
  constantEqual,
} from "../../../lib/auth";
export const dynamic = "force-dynamic";
const campuses = ["wushan", "university", "international"] as const;
const categories = [
  "日常分享",
  "学习互助",
  "失物招领",
  "活动组队",
  "闲置交换",
  "心声树洞",
] as const;
const postSchema = z.object({
  title: z.string().trim().min(2, "标题至少 2 字").max(80),
  content: z.string().trim().min(2, "内容至少 2 字").max(3000),
  campus: z.enum(campuses),
  category: z.enum(categories),
  location: z.string().trim().max(80).default(""),
  image: z
    .string()
    .regex(/^[a-f0-9-]{36}$/)
    .nullable()
    .optional(),
  status: z.enum(["open", "resolved"]).default("open"),
});
const accountSchema = z.object({
  email: z
    .string()
    .trim()
    .email("请输入有效邮箱")
    .max(254)
    .transform((x) => x.toLowerCase()),
  password: z
    .string()
    .min(10, "密码至少 10 位")
    .max(128, "密码不能超过 128 位"),
});
const nickname = z
  .string()
  .trim()
  .min(2, "昵称至少 2 字")
  .max(20, "昵称最多 20 字");
const json = (
  value: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  Response.json(value, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
  });
async function body(req: Request) {
  if (Number(req.headers.get("content-length") || 0) > 20000)
    throw new ApiError("内容太大", 413);
  const t = await req.text();
  if (t.length > 20000) throw new ApiError("内容太大", 413);
  try {
    return JSON.parse(t);
  } catch {
    throw new ApiError("请求格式无效");
  }
}
const uid = () => crypto.randomUUID();
async function handle(req: Request) {
  try {
    const url = new URL(req.url),
      path = url.pathname.replace(/^\/api\//, ""),
      method = req.method,
      user = await getUser(req),
      now = Date.now();
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      if (
        req.headers.get("sec-fetch-site") === "cross-site" ||
        (origin && new URL(origin).host !== url.host)
      )
        throw new ApiError("请从本站页面操作", 403);
      if (req.headers.get("x-mumian-client") !== "1")
        throw new ApiError("请求来源无效", 403);
    }
    const required = () => {
      if (!user) throw new ApiError("请先登录", 401);
      return user;
    };
    const admin = () => {
      const key = (env as unknown as Record<string, string>).ADMIN_KEY;
      if (!key || !constantEqual(req.headers.get("x-admin-key") || "", key))
        throw new ApiError("管理密钥无效", 403);
    };
    if (path === "me" && method === "GET") return json({ user });
    if (path === "register" && method === "POST") {
      await rate(req, "register", 5, 3600000);
      const raw = await body(req),
        a = accountSchema.parse(raw),
        name = nickname.parse(raw.nickname);
      if (
        await db()
          .prepare("SELECT id FROM users WHERE email=?")
          .bind(a.email)
          .first()
      )
        throw new ApiError("该邮箱已注册，请登录或使用恢复码找回");
      const id = uid(),
        recovery = randomToken();
      await db()
        .prepare(
          "INSERT INTO users (id,email,nickname,password,recovery,created) VALUES (?,?,?,?,?,?)",
        )
        .bind(
          id,
          a.email,
          name,
          await hashPassword(a.password),
          await digest(recovery),
          now,
        )
        .run();
      return json(
        {
          user: { id, email: a.email, nickname: name },
          recoveryCode: recovery,
        },
        201,
        { "Set-Cookie": await makeSession(id, req) },
      );
    }
    if (path === "login" && method === "POST") {
      await rate(req, "login", 30);
      const a = accountSchema.parse(await body(req));
      await rate(req, "login-account", 10, 900000, a.email);
      const found = await db()
        .prepare("SELECT id,email,nickname,password FROM users WHERE email=?")
        .bind(a.email)
        .first<{
          id: string;
          email: string;
          nickname: string;
          password: string;
        }>();
      if (!found || !(await verify(a.password, found.password)))
        throw new ApiError("邮箱或密码不正确", 401);
      return json(
        {
          user: { id: found.id, email: found.email, nickname: found.nickname },
        },
        200,
        { "Set-Cookie": await makeSession(found.id, req) },
      );
    }
    if (path === "recover" && method === "POST") {
      await rate(req, "recover", 8);
      const raw = await body(req),
        a = accountSchema.parse(raw),
        code = z
          .string()
          .regex(/^[a-f0-9]{48}$/, "恢复码格式不正确")
          .parse(raw.code);
      const found = await db()
        .prepare("SELECT id,recovery FROM users WHERE email=?")
        .bind(a.email)
        .first<{ id: string; recovery: string }>();
      if (!found || !constantEqual(await digest(code), found.recovery))
        throw new ApiError("邮箱或恢复码不正确", 401);
      const replacement = randomToken(),
        password = await hashPassword(a.password);
      const updated = await db()
        .prepare(
          "UPDATE users SET password=?,recovery=? WHERE id=? AND recovery=? RETURNING id",
        )
        .bind(password, await digest(replacement), found.id, found.recovery)
        .first();
      if (!updated) throw new ApiError("恢复码已使用，请使用最新恢复码", 409);
      await db()
        .prepare("DELETE FROM sessions WHERE user_id=?")
        .bind(found.id)
        .run();
      return json({ recoveryCode: replacement }, 200, {
        "Set-Cookie": cookie("", req, 0),
      });
    }
    if (path === "logout" && method === "POST") {
      const token = req.headers
        .get("cookie")
        ?.split(";")
        .map((x) => x.trim())
        .find((x) => x.startsWith("mumian_session="))
        ?.slice(15);
      if (token)
        await db()
          .prepare("DELETE FROM sessions WHERE token=?")
          .bind(await digest(token))
          .run();
      return json({ ok: true }, 200, { "Set-Cookie": cookie("", req, 0) });
    }
    if (path === "profile" && method === "PATCH") {
      const u = required(),
        raw = await body(req),
        name = nickname.parse(raw.nickname);
      await db()
        .prepare("UPDATE users SET nickname=? WHERE id=?")
        .bind(name, u.id)
        .run();
      return json({ user: { ...u, nickname: name } });
    }
    if (path === "posts" && method === "GET") {
      const page = Math.max(
          0,
          Math.min(500, parseInt(url.searchParams.get("page") || "0") || 0),
        ),
        campus = url.searchParams.get("campus"),
        category = url.searchParams.get("category"),
        scope = url.searchParams.get("scope"),
        q = (url.searchParams.get("q") || "").slice(0, 100),
        sort = url.searchParams.get("sort");
      let where = "p.hidden=0",
        args: unknown[] = [];
      if (campus && campus !== "all") {
        where += " AND p.campus=?";
        args.push(campus);
      }
      if (category && category !== "全部") {
        where += " AND p.category=?";
        args.push(category);
      }
      if (q) {
        where +=
          " AND (p.title LIKE ? ESCAPE '!' OR p.content LIKE ? ESCAPE '!')";
        const value = "%" + q.replace(/[!%_]/g, (m) => "!" + m) + "%";
        args.push(value, value);
      }
      if (scope === "mine") {
        required();
        where += " AND p.author_id=?";
        args.push(user!.id);
      }
      if (scope === "saved") {
        required();
        where +=
          " AND EXISTS(SELECT 1 FROM reactions r WHERE r.post_id=p.id AND r.user_id=? AND r.kind='save')";
        args.push(user!.id);
      }
      const order =
        sort === "hot"
          ? "likes DESC,p.created DESC,p.id DESC"
          : "p.created DESC,p.id DESC";
      const result = await db()
        .prepare(
          `SELECT p.id,p.title,p.content,p.campus,p.category,p.location,p.image,p.status,p.created,p.updated,u.nickname AS author,(p.author_id=?) AS mine,(SELECT count(*) FROM reactions r WHERE r.post_id=p.id AND r.kind='like') AS likes,(SELECT count(*) FROM comments c WHERE c.post_id=p.id) AS comments,EXISTS(SELECT 1 FROM reactions r WHERE r.post_id=p.id AND r.user_id=? AND r.kind='like') AS liked,EXISTS(SELECT 1 FROM reactions r WHERE r.post_id=p.id AND r.user_id=? AND r.kind='save') AS saved FROM posts p JOIN users u ON u.id=p.author_id WHERE ${where} ORDER BY ${order} LIMIT 21 OFFSET ?`,
        )
        .bind(
          user?.id || "",
          user?.id || "",
          user?.id || "",
          ...args,
          page * 20,
        )
        .all();
      return json({
        posts: result.results.slice(0, 20),
        hasMore: result.results.length > 20,
      });
    }
    if (path === "posts" && method === "POST") {
      const u = required();
      await rate(req, "new-post", 12, 3600000, u.id);
      const p = postSchema.parse(await body(req));
      if (
        p.image &&
        !(await db()
          .prepare("SELECT id FROM media WHERE id=? AND owner=?")
          .bind(p.image, u.id)
          .first())
      )
        throw new ApiError("图片不属于当前账号");
      const id = uid();
      await db()
        .prepare(
          "INSERT INTO posts (id,author_id,title,content,campus,category,location,image,status,created,updated) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        )
        .bind(
          id,
          u.id,
          p.title,
          p.content,
          p.campus,
          p.category,
          p.location,
          p.image || null,
          p.status,
          now,
          now,
        )
        .run();
      return json({ id }, 201);
    }
    const postMatch = path.match(
      /^posts\/([a-f0-9-]{36})(?:\/(comments|reaction|report))?$/,
    );
    if (postMatch) {
      const id = postMatch[1],
        action = postMatch[2],
        p = await db()
          .prepare("SELECT * FROM posts WHERE id=? AND hidden=0")
          .bind(id)
          .first<Record<string, any>>();
      if (!p) throw new ApiError("帖子不存在或已下架", 404);
      if (!action && method === "PATCH") {
        const u = required();
        if (p.author_id !== u.id) throw new ApiError("只能修改自己的帖子", 403);
        const data = postSchema.parse(await body(req));
        if (
          data.image &&
          !(await db()
            .prepare("SELECT id FROM media WHERE id=? AND owner=?")
            .bind(data.image, u.id)
            .first())
        )
          throw new ApiError("图片无效");
        await db()
          .prepare(
            "UPDATE posts SET title=?,content=?,campus=?,category=?,location=?,image=?,status=?,updated=? WHERE id=? AND author_id=?",
          )
          .bind(
            data.title,
            data.content,
            data.campus,
            data.category,
            data.location,
            data.image || null,
            data.status,
            now,
            id,
            u.id,
          )
          .run();
        return json({ ok: true });
      }
      if (!action && method === "DELETE") {
        const u = required();
        if (p.author_id !== u.id) throw new ApiError("只能撤回自己的帖子", 403);
        await db()
          .prepare("DELETE FROM posts WHERE id=? AND author_id=?")
          .bind(id, u.id)
          .run();
        if (p.image) {
          await env.BUCKET?.delete(p.image);
          await db()
            .prepare("DELETE FROM media WHERE id=?")
            .bind(p.image)
            .run();
        }
        return json({ ok: true });
      }
      if (action === "comments" && method === "GET") {
        const rows = await db()
          .prepare(
            "SELECT c.id,c.content,c.created,u.nickname AS author,(c.author_id=?) AS mine FROM comments c JOIN users u ON u.id=c.author_id WHERE c.post_id=? ORDER BY c.created,c.id LIMIT 201",
          )
          .bind(user?.id || "", id)
          .all();
        return json({
          comments: rows.results.slice(0, 200),
          truncated: rows.results.length > 200,
        });
      }
      if (action === "comments" && method === "POST") {
        const u = required();
        await rate(req, "comment", 30, 3600000, u.id);
        const text = z
          .string()
          .trim()
          .min(1)
          .max(500)
          .parse((await body(req)).content);
        const count = await db()
          .prepare("SELECT count(*) AS n FROM comments WHERE post_id=?")
          .bind(id)
          .first<{ n: number }>();
        if ((count?.n || 0) >= 200)
          throw new ApiError("该帖已达到 200 条评论上限");
        await db()
          .prepare(
            "INSERT INTO comments (id,post_id,author_id,content,created) VALUES (?,?,?,?,?)",
          )
          .bind(uid(), id, u.id, text, now)
          .run();
        return json({ ok: true }, 201);
      }
      if (action === "reaction" && method === "POST") {
        const u = required();
        await rate(req, "reaction", 100, 60000, u.id);
        const data = z
          .object({ kind: z.enum(["like", "save"]), active: z.boolean() })
          .parse(await body(req));
        if (data.active)
          await db()
            .prepare(
              "INSERT OR IGNORE INTO reactions (user_id,post_id,kind) VALUES (?,?,?)",
            )
            .bind(u.id, id, data.kind)
            .run();
        else
          await db()
            .prepare(
              "DELETE FROM reactions WHERE user_id=? AND post_id=? AND kind=?",
            )
            .bind(u.id, id, data.kind)
            .run();
        return json({ ok: true });
      }
      if (action === "report" && method === "POST") {
        const u = required();
        await rate(req, "report", 10, 3600000, u.id);
        const reason = z
          .string()
          .trim()
          .min(2)
          .max(300)
          .parse((await body(req)).reason);
        await db()
          .prepare(
            "INSERT OR IGNORE INTO reports (id,post_id,user_id,reason,created) VALUES (?,?,?,?,?)",
          )
          .bind(uid(), id, u.id, reason, now)
          .run();
        return json({ ok: true });
      }
    }
    const commentMatch = path.match(/^comments\/([a-f0-9-]{36})$/);
    if (commentMatch && method === "DELETE") {
      const u = required();
      const result = await db()
        .prepare("DELETE FROM comments WHERE id=? AND author_id=? RETURNING id")
        .bind(commentMatch[1], u.id)
        .first();
      if (!result) throw new ApiError("评论不存在或不属于当前账号", 403);
      return json({ ok: true });
    }
    if (path === "upload" && method === "POST") {
      const u = required();
      await rate(req, "upload", 20, 3600000, u.id);
      if (!env.BUCKET) throw new ApiError("图片存储未连接", 503);
      if (Number(req.headers.get("content-length") || 0) > 3 * 1024 * 1024)
        throw new ApiError("图片不能超过 3 MB", 413);
      const bytes = new Uint8Array(await req.arrayBuffer());
      if (bytes.length > 3 * 1024 * 1024)
        throw new ApiError("图片不能超过 3 MB", 413);
      const type =
        bytes[0] === 255 && bytes[1] === 216
          ? "image/jpeg"
          : bytes[0] === 137 &&
              bytes[1] === 80 &&
              bytes[2] === 78 &&
              bytes[3] === 71
            ? "image/png"
            : String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
                String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
              ? "image/webp"
              : null;
      if (!type) throw new ApiError("仅支持 JPG、PNG 或 WebP 图片");
      const id = uid();
      await env.BUCKET.put(id, bytes, { httpMetadata: { contentType: type } });
      await db()
        .prepare("INSERT INTO media (id,owner,type,created) VALUES (?,?,?,?)")
        .bind(id, u.id, type, now)
        .run();
      return json({ id }, 201);
    }
    const imageMatch = path.match(/^images\/([a-f0-9-]{36})$/);
    if (imageMatch && method === "GET") {
      const id = imageMatch[1],
        exists = await db()
          .prepare(
            "SELECT m.id FROM media m WHERE m.id=? AND (m.owner=? OR EXISTS(SELECT 1 FROM posts p WHERE p.image=m.id AND p.hidden=0))",
          )
          .bind(id, user?.id || "")
          .first();
      if (!exists) throw new ApiError("图片不存在", 404);
      const object = await env.BUCKET?.get(id);
      if (!object) throw new ApiError("图片不存在", 404);
      return new Response(object.body, {
        headers: {
          "Content-Type": object.httpMetadata?.contentType || "image/jpeg",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    if (path === "admin/reports" && method === "POST") {
      admin();
      const result = await db()
        .prepare(
          "SELECT r.id,r.reason,r.created,r.handled,p.id AS post_id,p.title,p.content,p.hidden FROM reports r JOIN posts p ON p.id=r.post_id ORDER BY r.handled,r.created DESC LIMIT 100",
        )
        .all();
      return json({ reports: result.results });
    }
    if (path === "admin/moderate" && method === "POST") {
      admin();
      const data = z
        .object({
          postId: z.string().uuid(),
          hidden: z.boolean(),
          reportId: z.string().uuid(),
        })
        .parse(await body(req));
      await db().batch([
        db()
          .prepare("UPDATE posts SET hidden=?,updated=? WHERE id=?")
          .bind(data.hidden ? 1 : 0, now, data.postId),
        db()
          .prepare("UPDATE reports SET handled=1 WHERE id=? AND post_id=?")
          .bind(data.reportId, data.postId),
      ]);
      return json({ ok: true });
    }
    throw new ApiError("接口不存在", 404);
  } catch (error) {
    if (error instanceof z.ZodError)
      return json({ error: error.issues[0]?.message || "请检查输入" }, 400);
    if (error instanceof ApiError)
      return json({ error: error.message }, error.status);
    console.error(
      "API failure",
      error instanceof Error ? error.name : "unknown",
    );
    return json({ error: "服务暂时不可用，请稍后重试" }, 503);
  }
}
export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
