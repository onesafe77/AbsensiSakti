import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Starting SIDAK Workshop table migration...");

  try {
    // Create sidak_workshop_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_workshop_sessions (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        tanggal date NOT NULL,
        nama_workshop text NOT NULL,
        lokasi text NOT NULL,
        penanggung_jawab_area text,
        total_equipment integer DEFAULT 0,
        activity_photos text[],
        created_by varchar,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_workshop_sessions table");

    // Create index on sessions
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_workshop_sessions_created_by
      ON sidak_workshop_sessions(created_by)
    `;
    console.log("✅ Created index on sidak_workshop_sessions");

    // Create sidak_workshop_equipment table
    // Each equipment type has its own inspection items stored as JSON
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_workshop_equipment (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_workshop_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        equipment_type varchar NOT NULL,
        no_register_peralatan varchar,
        inspection_results jsonb NOT NULL DEFAULT '{}',
        tindak_lanjut_perbaikan text,
        due_date date,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_workshop_equipment table");

    // Create index on equipment
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_workshop_equipment_session
      ON sidak_workshop_equipment(session_id)
    `;
    console.log("✅ Created index on sidak_workshop_equipment");

    // Create sidak_workshop_inspectors table (different from observers - this form uses "inspectors")
    await sql`
      CREATE TABLE IF NOT EXISTS sidak_workshop_inspectors (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_workshop_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        nama text NOT NULL,
        perusahaan text,
        tanda_tangan text,
        created_at timestamp DEFAULT now()
      )
    `;
    console.log("✅ Created sidak_workshop_inspectors table");

    // Create index on inspectors
    await sql`
      CREATE INDEX IF NOT EXISTS IDX_workshop_inspectors_session
      ON sidak_workshop_inspectors(session_id)
    `;
    console.log("✅ Created index on sidak_workshop_inspectors");

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
