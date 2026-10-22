import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
const key = readFileSync(".dev.vars", "utf8").trim().slice("ADMIN_KEY=".length),
  base = "http://127.0.0.1:5173";
const call = async (path, data, keyValue = key) => {
  const r = await fetch(base + "/api/" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-mumian-client": "1",
      "x-admin-key": keyValue,
      Origin: base,
    },
    body: JSON.stringify(data || {}),
  });
  return { status: r.status, data: await r.json() };
};
assert.equal((await call("admin/reports", {}, "wrong")).status, 403);
const r = await call("admin/reports");
assert.equal(r.status, 200);
const report = r.data.reports.find((r) => !r.handled);
assert.ok(report, "Need local report created by API tests");
assert.equal(
  (
    await call("admin/moderate", {
      postId: report.post_id,
      reportId: report.id,
      hidden: true,
    })
  ).status,
  200,
);
const hidden = await fetch(base + "/api/posts/" + report.post_id + "/comments");
assert.equal(hidden.status, 404);
assert.equal(
  (
    await call("admin/moderate", {
      postId: report.post_id,
      reportId: report.id,
      hidden: false,
    })
  ).status,
  200,
);
console.log("PASS: admin key protection, report review, hide and restore.");
