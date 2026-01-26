import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Starting SIDAK Digital table migration...");

  try {
    // Create sidak_digital_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_digital_sessions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tanggal date NOT NULL,
        waktu varchar,
        lokasi text NOT NULL,
        shift varchar,
        departemen text,
        total_sampel integer DEFAULT 0,
        activity_photos text[],
        created_by varchar,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_digital_sessions table");

    // Create sidak_digital_records table (7 compliance questions)
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_digital_records (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_digital_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        nama text NOT NULL,
        nik text,
        perusahaan text,
        q1_lokasi_kerja boolean DEFAULT false,
        q2_sap_hazard boolean DEFAULT false,
        q3_sap_inspeksi boolean DEFAULT false,
        q4_sap_observasi boolean DEFAULT false,
        q5_validasi_famous boolean DEFAULT false,
        q6_identifikasi_bahaya boolean DEFAULT false,
        q7_prosedur_keselamatan boolean DEFAULT false,
        keterangan text,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_digital_records table");

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_digital_records_session
      ON sidak_digital_records(session_id)
    `;
    console.log("✅ Created index on sidak_digital_records");

    // Create sidak_digital_observers table
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_digital_observers (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_digital_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        nama text NOT NULL,
        nik text,
        perusahaan text,
        tanda_tangan text,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_digital_observers table");

    // Create index
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_digital_observers_session
      ON sidak_digital_observers(session_id)
    `;
    console.log("✅ Created index on sidak_digital_observers");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
