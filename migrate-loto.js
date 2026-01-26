import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Starting LOTO table migration...");

  try {
    // Add new columns to sidak_loto_records table
    await sql`
      ALTER TABLE sidak_loto_records
      ADD COLUMN IF NOT EXISTS nama text,
      ADD COLUMN IF NOT EXISTS nik text,
      ADD COLUMN IF NOT EXISTS perusahaan text,
      ADD COLUMN IF NOT EXISTS q1_gembok_tag_terpasang boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS q2_danger_tag_sesuai boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS q3_gembok_sesuai boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS q4_kunci_unik boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS q5_hasp_benar boolean DEFAULT false
    `;

    console.log("✅ Successfully added new columns to sidak_loto_records table");

    // Optionally migrate existing data from old fields to new fields
    await sql`
      UPDATE sidak_loto_records
      SET nama = COALESCE(nama, nama_nik, nama_karyawan)
      WHERE nama IS NULL
    `;

    console.log("✅ Migrated existing data");
    console.log("Migration completed successfully!");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
