import "dotenv/config";
import { pool } from "../server/db";

async function main() {
    console.log("Starting manual migration...");
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS kompetensi_sertifikat_monitoring (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        employee_id varchar REFERENCES employees(id),
        employee_name text,
        department text,
        position text,
        
        nama_kompetensi text NOT NULL,
        kategori text NOT NULL,
        
        no_sertifikat text,
        lembaga text,
        
        tgl_terbit text NOT NULL,
        masa_berlaku_tahun integer NOT NULL,
        tgl_expired text NOT NULL,
        
        monitoring_harian_status text DEFAULT 'Aktif',
        
        no_surat_penunjukan text,
        bukti_penunjukan_pdf text,
        
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        created_by varchar
      );
    `);

        // Create indexes if they don't exist (primitive check or just create if not exists syntax if pg support)
        // PG supports CREATE INDEX IF NOT EXISTS
        await client.query(`CREATE INDEX IF NOT EXISTS "IDX_kompetensi_expiry" ON kompetensi_sertifikat_monitoring (tgl_expired);`);
        await client.query(`CREATE INDEX IF NOT EXISTS "IDX_kompetensi_employee" ON kompetensi_sertifikat_monitoring (employee_id);`);

        console.log("Table kompetensi_sertifikat_monitoring created or already exists.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        pool.end();
    }
}

main();
