import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Starting SIDAK Pencahayaan table migration...");

  try {
    // Create sidak_pencahayaan_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_pencahayaan_sessions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        nama_perusahaan text NOT NULL,
        jenis_alat_merk text NOT NULL,
        departemen text,
        no_seri_alat varchar,
        lokasi_pengukuran text NOT NULL,
        tanggal_pemeriksaan date NOT NULL,
        penanggungjawab_area text,
        waktu_pemeriksaan varchar,
        total_sampel integer DEFAULT 0,
        activity_photos text[],
        created_by varchar,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_pencahayaan_sessions table");

    // Create sidak_pencahayaan_records table (measurement-based)
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_pencahayaan_records (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_pencahayaan_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        titik_pengambilan text NOT NULL,
        sumber_penerangan text,
        jenis_pengukuran text,
        intensitas_pencahayaan numeric,
        jarak_sumber_cahaya text,
        secara_visual varchar,
        keterangan text,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_pencahayaan_records table");

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_pencahayaan_records_session
      ON sidak_pencahayaan_records(session_id)
    `;
    console.log("✅ Created index on sidak_pencahayaan_records");

    // Create sidak_pencahayaan_observers table
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_pencahayaan_observers (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_pencahayaan_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        nama text NOT NULL,
        nik text,
        perusahaan text,
        tanda_tangan text,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_pencahayaan_observers table");

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_pencahayaan_observers_session
      ON sidak_pencahayaan_observers(session_id)
    `;
    console.log("✅ Created index on sidak_pencahayaan_observers");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
