
import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Checking sidak_loto_records columns...");
    try {
        const resultRecords = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'sidak_loto_records'
      ORDER BY ordinal_position;
    `);

        console.log("--- COLUMNS FOUND (sidak_loto_records) ---");
        resultRecords.rows.forEach((r: any) => {
            console.log(`${r.column_name}: ${r.data_type} (Nullable: ${r.is_nullable})`);
        });

        // Check nama_karyawan nullable
        const namaKaryawan = resultRecords.rows.find((r: any) => r.column_name === 'nama_karyawan');
        if (namaKaryawan && namaKaryawan.is_nullable === 'NO') {
            console.error("FAILURE: nama_karyawan is still NOT NULL!");
            process.exit(1);
        } else {
            console.log("SUCCESS: nama_karyawan is Nullable: YES (or missing, which is fine)");
        }

        // Try INSERT
        console.log("Attempting dummy INSERT using sql.raw...");
        const sessions = await db.execute(sql`SELECT id FROM sidak_loto_sessions LIMIT 1`);

        if (sessions.rows.length > 0) {
            const sessionId = sessions.rows[0].id;
            console.log(`Using existing session ID: ${sessionId}`);

            // Use sql.raw for everything to avoid binding issues in this debug script
            const query = `
            INSERT INTO sidak_loto_records 
            (id, session_id, ordinal, nama, nik, perusahaan, created_at)
            VALUES 
            ('debug-${Date.now()}', '${sessionId}', 999, 'Debug User', '12345', 'Debug PT', NOW())
         `;
            await db.execute(sql.raw(query));
            console.log("SUCCESS: Dummy insert worked!");

            await db.execute(sql.raw(`DELETE FROM sidak_loto_records WHERE ordinal = 999 AND session_id = '${sessionId}'`));
            console.log("Cleanup successful.");
        } else {
            console.log("No sessions found.");
        }

        process.exit(0);
    } catch (err) {
        console.error("Error executing query:", err);
        process.exit(1);
    }
}

main();
