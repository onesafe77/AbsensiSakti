-- Migration: Add new employee columns
-- Safe to run multiple times (IF NOT EXISTS)

-- After NIK
ALTER TABLE employees ADD COLUMN IF NOT EXISTS isafe_number VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS id_itws VARCHAR(50);

-- Identitas
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ktp_no VARCHAR(32);

-- Kepegawaian
ALTER TABLE employees ADD COLUMN IF NOT EXISTS doh DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status_karyawan VARCHAR(30);

-- Resign
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tanggal_resign DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS catatan_resign TEXT;

-- SIM & SIMPER
ALTER TABLE employees ADD COLUMN IF NOT EXISTS type_sim VARCHAR(10);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS sim_no VARCHAR(50);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS expired_simpol DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS expired_simper_bib DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status_simper_bib VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS expired_simper_tia DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS status_simper_tia VARCHAR(20);

-- Alamat
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS provinsi VARCHAR(80);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address_group VARCHAR(80);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS domisili_karyawan VARCHAR(120);

-- OS Training
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tgl_ikut_pelatihan_os DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS merek_unit_digunakan_os VARCHAR(80);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS tgl_refreshment_os DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS refreshment_os VARCHAR(30);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS keterangan_os TEXT;

-- BPJS
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bpjs_kesehatan VARCHAR(50);
