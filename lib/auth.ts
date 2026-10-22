import { env } from "cloudflare:workers";
import { scryptAsync } from "@noble/hashes/scrypt.js";
const enc = new TextEncoder();
export const randomToken = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(24)), (v) =>
    v.toString(16).padStart(2, "0"),
  ).join("");
export const digest = async (v: string) =>
  Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", enc.encode(v))),
    (x) => x.toString(16).padStart(2, "0"),
  ).join("");
export async function hashPassword(password: string, salt = randomToken()) {
  const result = await scryptAsync(enc.encode(password), enc.encode(salt), {
    N: 16384,
    r: 8,
    p: 5,
    dkLen: 32,
    maxmem: 32 * 1024 * 1024,
  });
  return `scrypt$${salt}$${Array.from(result, (x) => x.toString(16).padStart(2, "0")).join("")}`;
}
export function constantEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export async function verify(password: string, stored: string) {
  const parts = stored.split("$");
  return (
    parts[0] === "scrypt" &&
    parts.length === 3 &&
    constantEqual(await hashPassword(password, parts[1]), stored)
  );
}
export function db() {
  if (!env.DB) throw Error("数据库尚未连接");
  return env.DB;
}
export type User = { id: string; email: string; nickname: string };
export async function getUser(req: Request): Promise<User | null> {
  const token = req.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith("mumian_session="))
    ?.slice(15);
  if (!token || !/^[a-f0-9]{48}$/.test(token)) return null;
  return db()
    .prepare(
      "SELECT u.id,u.email,u.nickname FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
    )
    .bind(await digest(token), Date.now())
    .first<User>();
}
export async function makeSession(user: string, req: Request) {
  await db()
    .prepare("DELETE FROM sessions WHERE expires<?")
    .bind(Date.now())
    .run();
  const token = randomToken();
  await db()
    .prepare("INSERT INTO sessions (token,user_id,expires) VALUES (?,?,?)")
    .bind(await digest(token), user, Date.now() + 7 * 86400000)
    .run();
  return cookie(token, req, 7 * 86400);
}
export const cookie = (token: string, req: Request, age: number) =>
  `mumian_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${age}${new URL(req.url).protocol === "https:" ? "; Secure" : ""}`;
export async function rate(
  req: Request,
  kind: string,
  max: number,
  windowMs = 900000,
  extra = "",
) {
  const now = Date.now(),
    ip = req.headers.get("cf-connecting-ip") || "local",
    key = await digest(`${kind}:${ip}:${extra}:${Math.floor(now / windowMs)}`);
  const row = await db()
    .prepare(
      "INSERT INTO limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count",
    )
    .bind(key, now + windowMs)
    .first<{ count: number }>();
  if (Math.random() < 0.03)
    await db().prepare("DELETE FROM limits WHERE expires<?").bind(now).run();
  if ((row?.count || 0) > max)
    throw new ApiError("操作过于频繁，请稍后重试", 429);
}
export class ApiError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
