
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://")

try:
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        print("Fixing schema...")
        
        # Add ID (already done but safe to repeat with IF NOT EXISTS logic or catch)
        try:
            conn.execute(text('ALTER TABLE fms_fatigue_alerts ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY'))
            print("ID column check pass.")
        except Exception as e:
            print(f"ID check info: {e}")

        # Add employee_id
        try:
             conn.execute(text('ALTER TABLE fms_fatigue_alerts ADD COLUMN IF NOT EXISTS employee_id TEXT'))
             print("employee_id added.")
        except: pass

        # Add created_at
        try:
             conn.execute(text('ALTER TABLE fms_fatigue_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()'))
             print("created_at added.")
        except: pass

        # Add updated_at
        try:
             conn.execute(text('ALTER TABLE fms_fatigue_alerts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()'))
             print("updated_at added.")
        except: pass

        # Add sla_seconds
        try:
             conn.execute(text('ALTER TABLE fms_fatigue_alerts ADD COLUMN IF NOT EXISTS sla_seconds INTEGER'))
             print("sla_seconds added.")
        except: pass

        # Fix month column type (it was bigint, needs to be TEXT)
        try:
             # Using USING clause to handle conversion if there's already data
             conn.execute(text('ALTER TABLE fms_fatigue_alerts ALTER COLUMN month TYPE TEXT USING month::TEXT'))
             print("month column type fixed to TEXT.")
        except Exception as e:
             print(f"Month fix info: {e}")

        conn.commit()
        print("Schema fixed.")
except Exception as e:
    print(f"Error: {e}")
