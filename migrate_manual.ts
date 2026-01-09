import 'dotenv/config';
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Starting manual migration for Sidak Rambu...");

  try {
    // Create Sessions Table
    console.log("Creating sidak_rambu_sessions...");
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_rambu_sessions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tanggal varchar NOT NULL,
        shift varchar NOT NULL,
        waktu_mulai varchar NOT NULL,
        waktu_selesai varchar NOT NULL,
        lokasi text NOT NULL,
        total_sampel integer NOT NULL DEFAULT 0,
        activity_photos text[],
        created_at timestamp DEFAULT now()
      );
    `;

    // Create Observations Table - FIX: "no_kendaraan" was text in previous schema attempts, let's allow varchar or text. 
    // Using varchar to match what I put in schema.ts last.
    console.log("Creating sidak_rambu_observations...");
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_rambu_observations (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_rambu_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        nama text NOT NULL,
        no_kendaraan varchar NOT NULL,
        perusahaan text NOT NULL,
        rambu_stop boolean NOT NULL DEFAULT true,
        rambu_give_way boolean NOT NULL DEFAULT true,
        rambu_kecepatan_max boolean NOT NULL DEFAULT true,
        rambu_larangan_masuk boolean NOT NULL DEFAULT true,
        rambu_larangan_parkir boolean NOT NULL DEFAULT true,
        rambu_wajib_helm boolean NOT NULL DEFAULT true,
        rambu_larangan_uturn boolean NOT NULL DEFAULT true,
        keterangan text DEFAULT '',
        created_at timestamp DEFAULT now()
      );
    `;

    // Create Observers Table
    console.log("Creating sidak_rambu_observers...");
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_rambu_observers (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_rambu_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        nama text NOT NULL,
        perusahaan text NOT NULL,
        signature_data_url text NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `;

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  }
}

main();
