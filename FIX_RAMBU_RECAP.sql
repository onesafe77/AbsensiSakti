-- ====================================
-- MANUAL FIX: Add created_by to Rambu
-- ====================================
-- Run this SQL in your PostgreSQL database client (pgAdmin, DBeaver, etc.)

-- Step 1: Add created_by column
ALTER TABLE sidak_rambu_sessions 
ADD COLUMN IF NOT EXISTS created_by VARCHAR;

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS "IDX_rambu_sessions_created_by" 
ON sidak_rambu_sessions(created_by);

-- Step 3: Update existing sessions
UPDATE sidak_rambu_sessions 
SET created_by = 'ADMIN' 
WHERE created_by IS NULL;

-- Step 4: Verify the changes
SELECT id, tanggal, shift, lokasi, created_by 
FROM sidak_rambu_sessions 
LIMIT 5;

-- You should see created_by = 'ADMIN' for existing records
