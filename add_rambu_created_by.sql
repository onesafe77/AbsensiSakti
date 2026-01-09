-- Add createdBy column to sidak_rambu_sessions table
ALTER TABLE sidak_rambu_sessions 
ADD COLUMN IF NOT EXISTS created_by VARCHAR;

-- Create index on created_by
CREATE INDEX IF NOT EXISTS "IDX_rambu_sessions_created_by" ON sidak_rambu_sessions(created_by);

-- Update existing sessions to set createdBy to 'ADMIN' as default
UPDATE sidak_rambu_sessions 
SET created_by = 'ADMIN' 
WHERE created_by IS NULL;
