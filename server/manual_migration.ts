import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function migrate() {
    console.log("Starting manual migration...");

    try {
        // 1. Create document_versions table
        console.log("Creating document_versions table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_versions (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id VARCHAR NOT NULL REFERENCES document_masterlist(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        revision_number INTEGER NOT NULL DEFAULT 0,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT DEFAULT 'application/pdf',
        signed_file_path TEXT,
        signed_at TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'DRAFT',
        changes_note TEXT,
        uploaded_by VARCHAR NOT NULL,
        uploaded_by_name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

        // Add Indexes for document_versions
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_doc_versions_document" ON document_versions (document_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_doc_versions_status" ON document_versions (status);`);


        // 2. Create change_requests table
        console.log("Creating change_requests table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS change_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id VARCHAR NOT NULL REFERENCES document_masterlist(id) ON DELETE CASCADE,
        request_type TEXT NOT NULL DEFAULT 'REVISION',
        priority TEXT NOT NULL DEFAULT 'NORMAL',
        reason TEXT NOT NULL,
        description TEXT,
        proposed_changes TEXT,
        affected_sections TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        reviewed_by VARCHAR REFERENCES employees(id),
        reviewed_by_name TEXT,
        reviewed_at TIMESTAMP,
        review_comments TEXT,
        completed_at TIMESTAMP,
        new_version_id VARCHAR REFERENCES document_versions(id),
        requested_by VARCHAR NOT NULL REFERENCES employees(id),
        requested_by_name TEXT NOT NULL,
        requested_at TIMESTAMP DEFAULT NOW()
      );
    `);

        // Add Indexes for change_requests
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_change_requests_document" ON change_requests (document_id);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_change_requests_status" ON change_requests (status);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_change_requests_requested_by" ON change_requests (requested_by);`);


        // 3. Create document_disposal_records table
        console.log("Creating document_disposal_records table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS document_disposal_records (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id VARCHAR NOT NULL,
        document_code TEXT,
        document_title TEXT,
        disposed_by VARCHAR REFERENCES employees(id),
        disposed_by_name TEXT,
        disposed_at TIMESTAMP DEFAULT NOW(),
        method TEXT NOT NULL DEFAULT 'ELECTRONIC_DELETION',
        reason TEXT,
        notes TEXT
      );
    `);

        // 4. Create external_documents table
        console.log("Creating external_documents table...");
        await db.execute(sql`
      CREATE TABLE IF NOT EXISTS external_documents (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        document_code VARCHAR NOT NULL,
        title TEXT NOT NULL,
        source TEXT NOT NULL,
        issued_by TEXT,
        version_number TEXT,
        issue_date TEXT,
        next_review_date TEXT,
        file_type TEXT NOT NULL DEFAULT 'LINK',
        file_url TEXT,
        file_name TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        distribution_required BOOLEAN NOT NULL DEFAULT FALSE,
        owner_id VARCHAR REFERENCES employees(id),
        owner_name TEXT,
        department TEXT,
        notes TEXT,
        created_by VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
     `);

        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_external_docs_code" ON external_documents (document_code);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_external_docs_source" ON external_documents (source);`);
        await db.execute(sql`CREATE INDEX IF NOT EXISTS "IDX_external_docs_status" ON external_documents (status);`);


        console.log("Migration completed successfully.");
        process.exit(0);

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
