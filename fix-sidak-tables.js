import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

async function fixTables() {
  console.log("🔧 Fixing SIDAK tables...");

  try {
    // Drop and recreate SIDAK Digital tables
    console.log("\n📍 Fixing SIDAK Digital...");
    await sql`DROP TABLE IF EXISTS sidak_digital_observers CASCADE`;
    await sql`DROP TABLE IF EXISTS sidak_digital_records CASCADE`;
    await sql`DROP TABLE IF EXISTS sidak_digital_sessions CASCADE`;

    await sql`
      CREATE TABLE sidak_digital_sessions (
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

    await sql`
      CREATE TABLE sidak_digital_records (
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

    await sql`CREATE INDEX IDX_digital_records_session ON sidak_digital_records(session_id)`;

    await sql`
      CREATE TABLE sidak_digital_observers (
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

    await sql`CREATE INDEX IDX_digital_observers_session ON sidak_digital_observers(session_id)`;
    console.log("✅ SIDAK Digital tables fixed");

    // Drop and recreate SIDAK Pencahayaan tables
    console.log("\n📍 Fixing SIDAK Pencahayaan...");
    await sql`DROP TABLE IF EXISTS sidak_pencahayaan_observers CASCADE`;
    await sql`DROP TABLE IF EXISTS sidak_pencahayaan_records CASCADE`;
    await sql`DROP TABLE IF EXISTS sidak_pencahayaan_sessions CASCADE`;

    await sql`
      CREATE TABLE sidak_pencahayaan_sessions (
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

    await sql`
      CREATE TABLE sidak_pencahayaan_records (
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

    await sql`CREATE INDEX IDX_pencahayaan_records_session ON sidak_pencahayaan_records(session_id)`;

    await sql`
      CREATE TABLE sidak_pencahayaan_observers (
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

    await sql`CREATE INDEX IDX_pencahayaan_observers_session ON sidak_pencahayaan_observers(session_id)`;
    console.log("✅ SIDAK Pencahayaan tables fixed");

    // Drop and recreate SIDAK Workshop tables
    console.log("\n📍 Fixing SIDAK Workshop...");
    await sql`DROP TABLE IF EXISTS sidak_workshop_inspectors CASCADE`;
    await sql`DROP TABLE IF EXISTS sidak_workshop_equipment CASCADE`;
    await sql`DROP TABLE IF EXISTS sidak_workshop_sessions CASCADE`;

    await sql`
      CREATE TABLE sidak_workshop_sessions (
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

    await sql`CREATE INDEX IDX_workshop_sessions_created_by ON sidak_workshop_sessions(created_by)`;

    await sql`
      CREATE TABLE sidak_workshop_equipment (
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

    await sql`CREATE INDEX IDX_workshop_equipment_session ON sidak_workshop_equipment(session_id)`;

    await sql`
      CREATE TABLE sidak_workshop_inspectors (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id varchar NOT NULL REFERENCES sidak_workshop_sessions(id) ON DELETE CASCADE,
        ordinal integer NOT NULL,
        nama text NOT NULL,
        perusahaan text,
        tanda_tangan text,
        created_at timestamp DEFAULT now()
      )
    `;

    await sql`CREATE INDEX IDX_workshop_inspectors_session ON sidak_workshop_inspectors(session_id)`;
    console.log("✅ SIDAK Workshop tables fixed");

    console.log("\n✅ All SIDAK tables fixed successfully!");
  } catch (error) {
    console.error("❌ Fix failed:", error);
    process.exit(1);
  }

  process.exit(0);
}

fixTables();
