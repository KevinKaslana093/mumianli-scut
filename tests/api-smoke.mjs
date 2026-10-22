import assert from "node:assert/strict";
const base = process.env.TEST_BASE || "http://127.0.0.1:5173";
const accounts = [];
const suffix = Date.now();
async function request(
  path,
  { method = "GET", data, cookie = "", headers = {} } = {},
) {
  const r = await fetch(base + "/api/" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-mumian-client": "1",
      Origin: base,
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { error: text };
  }
  return {
    status: r.status,
    data: json,
    cookie: r.headers.get("set-cookie")?.split(";")[0],
  };
}
for (let i = 0; i < 2; i++) {
  const email = `local-${suffix}-${i}@example.test`,
    password = `Strong-test-${suffix}-${i}`;
  const r = await request("register", {
    method: "POST",
    data: { email, password, nickname: "本地测试" + i },
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.match(r.cookie, /mumian_session=/);
  assert.equal(r.data.recoveryCode.length, 48);
  accounts.push({
    email,
    password,
    cookie: r.cookie,
    recovery: r.data.recoveryCode,
    id: r.data.user.id,
  });
}
const [a, b] = accounts;
const p = await request("posts", {
  method: "POST",
  cookie: a.cookie,
  data: {
    title: "本地测试动态",
    content: "仅用于本地数据库验证，不会出现在生产环境。",
    campus: "wushan",
    category: "学习互助",
    location: "测试位置",
  },
});
assert.equal(p.status, 201, JSON.stringify(p.data));
const id = p.data.id;
assert.equal(
  (
    await request("posts?campus=wushan&q=" + encodeURIComponent("本地测试"))
  ).data.posts.some((x) => x.id === id),
  true,
);
assert.equal(
  (await request("posts/" + id, { method: "DELETE", cookie: b.cookie })).status,
  403,
);
assert.equal(
  (await request("posts", { method: "POST", data: {} })).status,
  401,
);
assert.equal(
  (
    await request("posts/" + id + "/comments", {
      method: "POST",
      cookie: b.cookie,
      data: { content: "另一会话的评论" },
    })
  ).status,
  201,
);
const list = await request("posts/" + id + "/comments", { cookie: a.cookie });
assert.equal(list.data.comments.length, 1);
assert.equal(list.data.comments[0].mine, 0);
for (let i = 0; i < 2; i++)
  assert.equal(
    (
      await request("posts/" + id + "/reaction", {
        method: "POST",
        cookie: b.cookie,
        data: { kind: "like", active: true },
      })
    ).status,
    200,
  );
assert.equal(
  (await request("posts?scope=all", { cookie: b.cookie })).data.posts.find(
    (x) => x.id === id,
  ).likes,
  1,
);
assert.equal(
  (
    await request("posts/" + id + "/report", {
      method: "POST",
      cookie: b.cookie,
      data: { reason: "本地举报流程验证" },
    })
  ).status,
  200,
);
assert.equal(
  (
    await request("posts/" + id, {
      method: "PATCH",
      cookie: b.cookie,
      data: {},
    })
  ).status,
  403,
);
assert.equal(
  (
    await request("profile", {
      method: "PATCH",
      cookie: a.cookie,
      data: { nickname: "新的本地昵称" },
    })
  ).status,
  200,
);
assert.equal(
  (
    await request("posts/" + id, {
      method: "DELETE",
      cookie: a.cookie,
      headers: { Origin: "https://untrusted.invalid" },
    })
  ).status,
  403,
);
assert.equal(
  (
    await request("recover", {
      method: "POST",
      data: {
        email: a.email,
        password: "example-test-password-2026",
        code: a.recovery,
      },
    })
  ).status,
  200,
);
assert.equal((await request("me", { cookie: a.cookie })).data.user, null);
const login = await request("login", {
  method: "POST",
  data: { email: a.email, password: "example-test-password-2026" },
});
assert.equal(login.status, 200, JSON.stringify(login.data));
assert.equal(
  (await request("posts/" + id, { method: "DELETE", cookie: login.cookie }))
    .status,
  200,
);
assert.equal((await request("posts/" + id + "/comments")).status, 404);
assert.equal(
  (await request("logout", { method: "POST", cookie: login.cookie })).status,
  200,
);
assert.equal((await request("me", { cookie: login.cookie })).data.user, null);
console.log(
  "PASS: registration, sessions, public shared feed, other-user authorization, comments, idempotent likes, reports, CSRF, recovery, logout. Local test accounts only.",
);
