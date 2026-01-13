
import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://")

try:
    engine = create_engine(DB_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables in DB:")
    for table in tables:
        print(f"- {table}")
except Exception as e:
    print(f"Error: {e}")
