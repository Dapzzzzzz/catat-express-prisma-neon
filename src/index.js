import { createApp } from "./app.js";
import { createDatabase } from "./database.js";

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "127.0.0.1";
let db;
try {
  db = createDatabase();
  await db.$queryRaw`SELECT 1`;
} catch (error) {
  console.error(!process.env.DATABASE_URL ? error.message : "Koneksi ke Postgres gagal. Periksa DATABASE_URL dan jalankan migrasi.");
  await db?.$disconnect();
  process.exit(1);
}

const server = createApp({ db }).listen(port, host, () =>
  console.log(`Catat berjalan di http://localhost:${port}`),
);
server.on("error", async (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Port ${port} sedang dipakai. Tutup server sebelumnya atau pilih PORT lain.`
      : error.message,
  );
  await db.$disconnect();
  process.exitCode = 1;
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => server.close(async () => {
    await db.$disconnect();
    process.exit(0);
  }));
}
