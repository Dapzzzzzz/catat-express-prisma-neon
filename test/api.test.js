import assert from "node:assert/strict";
import { once } from "node:events";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createApp } from "../src/app.js";
import { createDatabase } from "../src/database.js";

test("Express CRUD persists on PostgreSQL and validates invalid requests", async (t) => {
  const db = createDatabase();
  const server = createApp({ db }).listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/api/tugas`;
  const judul = `Uji integrasi ${randomUUID()}`;
  const task = { judul, kategori: "Uji", tenggat: "2026-11-15", prioritas: "Tinggi", status: "Belum mulai", catatan: "Record sementara" };
  const call = async (method = "GET", suffix = "", body) => {
    const res = await fetch(base + suffix, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  };

  t.after(async () => {
    try { await db.tugas.deleteMany({ where: { judul } }); }
    finally {
      await new Promise((resolve) => server.close(resolve));
      await db.$disconnect();
    }
  });

  assert.equal((await call()).status, 200);
  assert.equal((await call("POST", "", { ...task, tenggat: "2026-02-30" })).status, 400);
  const created = await call("POST", "", task);
  assert.equal(created.status, 201);
  const { id } = created.body.data;
  assert.deepEqual(created.body.data, { ...task, id });
  assert.equal((await db.tugas.findUnique({ where: { id } })).status, "BELUM_MULAI");

  const updated = await call("PUT", `/${id}`, { ...task, tenggat: "", status: "Selesai" });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.tenggat, "");
  assert.equal(updated.body.data.status, "Selesai");
  const fresh = createDatabase();
  try {
    const row = await fresh.tugas.findUnique({ where: { id } });
    assert.equal(row.tenggat, null);
    assert.equal(row.status, "SELESAI");
  } finally { await fresh.$disconnect(); }

  assert.equal((await call("DELETE", `/${id}`)).status, 200);
  assert.equal(await db.tugas.findUnique({ where: { id } }), null);
  assert.equal((await call("DELETE", `/${id}`)).status, 404);
  assert.equal((await call("DELETE", "/abc")).status, 400);
});
