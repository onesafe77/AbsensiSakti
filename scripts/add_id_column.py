
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
        print("Adding ID column...")
        conn.execute(text('ALTER TABLE fms_fatigue_alerts ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY'))
        conn.commit()
        print("Success.")
except Exception as e:
    print(f"Error: {e}")
