
import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
    console.log("Fixing sidak_loto_records table...");
    try {
        // Add missing columns if they don't exist
        await db.execute(sql`
            DO $$ 
            BEGIN 
                -- Add nama_nik (deprecated)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sidak_loto_records' AND column_name = 'nama_nik') THEN
                    ALTER TABLE sidak_loto_records ADD COLUMN nama_nik text;
                    RAISE NOTICE 'Added nama_nik';
                END IF;

                -- Add no_lambung (deprecated)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sidak_loto_records' AND column_name = 'no_lambung') THEN
                    ALTER TABLE sidak_loto_records ADD COLUMN no_lambung text;
                    RAISE NOTICE 'Added no_lambung';
                END IF;

                -- Add tipe_unit (deprecated)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sidak_loto_records' AND column_name = 'tipe_unit') THEN
                    ALTER TABLE sidak_loto_records ADD COLUMN tipe_unit text;
                    RAISE NOTICE 'Added tipe_unit';
                END IF;

                -- Add lock_applied (deprecated)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sidak_loto_records' AND column_name = 'lock_applied') THEN
                    ALTER TABLE sidak_loto_records ADD COLUMN lock_applied boolean;
                    RAISE NOTICE 'Added lock_applied';
                END IF;

                -- Add tag_applied (deprecated)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sidak_loto_records' AND column_name = 'tag_applied') THEN
                    ALTER TABLE sidak_loto_records ADD COLUMN tag_applied boolean;
                    RAISE NOTICE 'Added tag_applied';
                END IF;

                -- Add hazard_identified (deprecated)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sidak_loto_records' AND column_name = 'hazard_identified') THEN
                    ALTER TABLE sidak_loto_records ADD COLUMN hazard_identified boolean;
                    RAISE NOTICE 'Added hazard_identified';
                END IF;

                -- Add jam_pasang (if missing)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sidak_loto_records' AND column_name = 'jam_pasang') THEN
                    ALTER TABLE sidak_loto_records ADD COLUMN jam_pasang varchar;
                    RAISE NOTICE 'Added jam_pasang';
                END IF;
            END $$;
        `);

        console.log("Successfully updated table schema.");
        process.exit(0);
    } catch (err) {
        console.error("Error updating schema:", err);
        process.exit(1);
    }
}

main();
