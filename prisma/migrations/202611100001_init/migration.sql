-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Prioritas" AS ENUM ('Rendah', 'Sedang', 'Tinggi');

-- CreateEnum
CREATE TYPE "StatusTugas" AS ENUM ('Belum mulai', 'Dikerjakan', 'Selesai');

-- CreateTable
CREATE TABLE "tugas" (
    "id" SERIAL NOT NULL,
    "judul" VARCHAR(100) NOT NULL,
    "kategori" VARCHAR(40) NOT NULL,
    "tenggat" DATE,
    "prioritas" "Prioritas" NOT NULL DEFAULT 'Sedang',
    "status" "StatusTugas" NOT NULL DEFAULT 'Belum mulai',
    "catatan" VARCHAR(800) NOT NULL DEFAULT '',
    "dibuat" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "diperbarui" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "tugas_pkey" PRIMARY KEY ("id")
);

