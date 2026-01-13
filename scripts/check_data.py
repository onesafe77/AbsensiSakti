
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://")

try:
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        # Check Columns
        print("Table Columns:")
        result = conn.execute(text("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'fms_fatigue_alerts'"))
        for row in result:
            print(row)

        # Check Count
        result = conn.execute(text("SELECT count(*) FROM fms_fatigue_alerts"))
        count = result.scalar()
        print(f"\nTotal Rows: {count}")
        # ... sample data removed for brevity ...
except Exception as e:
    print(f"Error: {e}")
