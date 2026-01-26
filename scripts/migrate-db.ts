import pg from 'pg';
const { Pool } = pg;

// USER PROVIDED NEON URL (SOURCE)
const SOURCE_URL = "postgresql://neondb_owner:npg_ijUusR9mFn3b@ep-gentle-hill-ada1kcgf.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

// RAILWAY URL (DESTINATION) - WILL BE PROMPT FOR THIS
// We will read this from environment variable or command line arg
const DEST_URL = process.env.RAILWAY_URL || process.argv[2];

if (!DEST_URL) {
    console.error("❌ Error: Railway Database URL is missing.");
    console.error("Usage: RAILWAY_URL='...' npm run migrate-data");
    console.error("OR:    npm run migrate-data 'postgresql://...'");
    process.exit(1);
}

const sourcePool = new Pool({ connectionString: SOURCE_URL });
const destPool = new Pool({ connectionString: DEST_URL });

async function migrate() {
    console.log("🚀 Starting migration...");
    console.log("SOURCE: Neon DB");
    console.log("DEST  : Railway DB");

    const clientSource = await sourcePool.connect();
    const clientDest = await destPool.connect();

    try {
        // 1. Get all tables
        const res = await clientSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `);

        const tables = res.rows.map((r: any) => r.table_name);
        console.log(`📋 Found ${tables.length} tables to migrate.`);

        // 2. Disable constraints on destination (IMPORTANT)
        await clientDest.query("SET session_replication_role = 'replica';");
        console.log("🔓 Constraints disabled on destination.");

        // 3. Migrate each table
        for (const table of tables) {
            try {
                console.log(`📦 Migrating table: ${table}...`);

                // Get valid columns from destination
                const resCols = await clientDest.query(`
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = $1 AND table_schema = 'public'
                `, [table]);
                const validColumns = new Set(resCols.rows.map((r: any) => r.column_name));

                // Read from source
                const { rows } = await clientSource.query(`SELECT * FROM "${table}"`);

                if (rows.length === 0) {
                    console.log(`   - Skipping (empty)`);
                    continue;
                }

                // Truncate destination first to avoid duplicates
                await clientDest.query(`TRUNCATE TABLE "${table}" CASCADE`);

                // Chunked Insert with Column Filtering
                const CHUNK_SIZE = 500;
                for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
                    const chunk = rows.slice(i, i + CHUNK_SIZE);

                    // Filter keys in the first row of chunk to find common columns
                    const firstRow = chunk[0];
                    const columnsToInsert = Object.keys(firstRow).filter(k => validColumns.has(k));

                    if (columnsToInsert.length === 0) {
                        console.warn(`    ⚠️  Skipping chunk: No valid columns for table ${table}`);
                        continue;
                    }

                    const columnsStr = columnsToInsert.map(k => `"${k}"`).join(", ");

                    const valuesPlaceholders = chunk.map((_, idx) => {
                        const paramOffset = idx * columnsToInsert.length;
                        return `(${columnsToInsert.map((_, j) => `$${paramOffset + j + 1}`).join(", ")})`;
                    }).join(", ");

                    const flatValues = chunk.flatMap(row =>
                        columnsToInsert.map(col => row[col])
                    );

                    const query = `INSERT INTO "${table}" (${columnsStr}) VALUES ${valuesPlaceholders}`;

                    await clientDest.query(query, flatValues);
                }
                console.log(`   - ✅ Copied ${rows.length} rows.`);

            } catch (tableErr: any) {
                console.error(`   ❌ Failed to migrate table ${table}: ${tableErr.message}`);
                // Continue to next table
            }
        }

        // 4. Re-enable constraints
        await clientDest.query("SET session_replication_role = 'origin';");
        console.log("🔒 Constraints re-enabled.");

        console.log("\n✅ MIGRATION COMPLETE! 🎉");

    } catch (err) {
        console.error("\n❌ MIGRATION CRITICAL ERROR:", err);
    } finally {
        clientSource.release();
        clientDest.release();
        await sourcePool.end();
        await destPool.end();
    }
}

migrate();
