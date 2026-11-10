import express from "express";
import { fileURLToPath } from "node:url";
import { toDatabase, toResponse } from "./tasks.js";

const publicDirectory = fileURLToPath(new URL("../public/", import.meta.url));

function httpError(status, message) {
  return Object.assign(new Error(message), { status });
}

function validate(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw httpError(400, "Isi request harus berupa objek JSON.");
  const clean = {};
  for (const key of [
    "judul",
    "kategori",
    "tenggat",
    "prioritas",
    "status",
    "catatan",
  ]) {
    if (typeof body[key] !== "string")
      throw httpError(400, `Kolom ${key} wajib berupa teks.`);
    clean[key] = body[key].trim();
  }
  clean.judul = clean.judul.replace(/\s+/g, " ");
  clean.kategori = clean.kategori.replace(/\s+/g, " ");
  if (clean.judul.length < 3 || clean.judul.length > 100)
    throw httpError(400, "Judul tugas harus berisi 3 sampai 100 karakter.");
  if (clean.kategori.length < 2 || clean.kategori.length > 40)
    throw httpError(400, "Kategori harus berisi 2 sampai 40 karakter.");
  if (clean.catatan.length > 800)
    throw httpError(400, "Catatan maksimal 800 karakter.");
  if (!["Tinggi", "Sedang", "Rendah"].includes(clean.prioritas))
    throw httpError(400, "Prioritas tidak valid.");
  if (!["Belum mulai", "Dikerjakan", "Selesai"].includes(clean.status))
    throw httpError(400, "Status tugas tidak valid.");
  if (clean.tenggat) {
    const date = new Date(`${clean.tenggat}T00:00:00.000Z`);
    if (
      !/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(clean.tenggat) ||
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== clean.tenggat
    ) {
      throw httpError(
        400,
        "Tenggat harus berupa tanggal yang valid (YYYY-MM-DD), atau kosong.",
      );
    }
  }
  return clean;
}

function parseId(value) {
  if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647)
    throw httpError(400, "ID tugas tidak valid.");
  return Number(value);
}

export function createApp({ db }) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "16kb" }));
  app.use((req, res, next) => {
    res.set("X-Content-Type-Options", "nosniff");
    if (req.path.startsWith("/api/")) res.set("Cache-Control", "no-store");
    next();
  });
  app.get("/api/tugas", async (_req, res) => {
    const data = (await db.tugas.findMany({ orderBy: { id: "asc" } })).map(toResponse);
    res.json({
      message: "Daftar tugas berhasil dimuat.",
      data,
      total: data.length,
    });
  });
  app.post("/api/tugas", async (req, res) => {
    const data = toResponse(await db.tugas.create({ data: toDatabase(validate(req.body)) }));
    res.status(201).json({ message: "Tugas ditambahkan.", data });
  });
  app.put("/api/tugas/:id", async (req, res) => {
    const data = toResponse(await db.tugas.update({
      where: { id: parseId(req.params.id) },
      data: toDatabase(validate(req.body)),
    }));
    res.json({ message: "Perubahan tugas tersimpan.", data });
  });
  app.delete("/api/tugas/:id", async (req, res) => {
    const data = toResponse(await db.tugas.delete({ where: { id: parseId(req.params.id) } }));
    res.json({ message: "Tugas dihapus.", data });
  });
  app.use("/api", (_req, _res, next) =>
    next(httpError(404, "Endpoint API tidak ditemukan.")),
  );
  app.use(express.static(publicDirectory));
  app.use((_req, res) =>
    res.status(404).json({ message: "Halaman tidak ditemukan." }),
  );
  app.use((error, _req, res, _next) => {
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ message: "Format JSON tidak valid." });
    if (error.code === "P2025") return res.status(404).json({ message: "Tugas tidak ditemukan." });
    const status = error.status || 500;
    if (status >= 500) console.error("Operasi database gagal:", error.code || error.name);
    res
      .status(status)
      .json({
        message:
          status >= 500
            ? "Perubahan belum tersimpan. Coba lagi."
            : error.message,
      });
  });
  return app;
}
