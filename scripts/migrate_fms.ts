
import * as dotenv from 'dotenv';
dotenv.config();

import { sql } from "drizzle-orm";
// We import db dynamically to ensure checking env vars happens AFTER dotenv.config()

async function migrate() {
    console.log('🔄 Starting FMS Violations Table Migration...');

    try {
        const { db } = await import("../server/db");

        // 1. Create Table (using UUID string type for id to match schema)
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS fms_violations (
        id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        violation_date date NOT NULL,
        violation_time time NOT NULL,
        violation_timestamp timestamp NOT NULL,
        vehicle_no varchar(50) NOT NULL,
        company varchar(50),
        violation_type varchar(100) NOT NULL,
        location varchar(150),
        coordinate varchar(50),
        shift varchar(20),
        date_opr date,
        week integer,
        month varchar(20),
        level real,
        validation_status varchar(50) DEFAULT 'Tidak Valid',
        uploaded_at timestamp DEFAULT now()
      );
    `);
        console.log('✅ Table fms_violations created (if not exists).');

        // 2. Create Indexes
        await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_fms_event ON fms_violations (violation_date, violation_time, vehicle_no, violation_type);
      CREATE INDEX IF NOT EXISTS idx_fms_date ON fms_violations (violation_date);
      CREATE INDEX IF NOT EXISTS idx_fms_shift ON fms_violations (shift);
      CREATE INDEX IF NOT EXISTS idx_fms_status ON fms_violations (validation_status);
      CREATE INDEX IF NOT EXISTS idx_fms_violation ON fms_violations (violation_type);
    `);
        console.log('✅ Indexes created.');

        console.log('🚀 Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
