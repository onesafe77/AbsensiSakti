
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

sql = """
ALTER TABLE activity_events 
ALTER COLUMN user_id TYPE TEXT USING user_id::text;
"""

print("Executing Column Fix SQL...")
try:
    cur.execute(sql)
    conn.commit()
    print("Column type fixed to TEXT.")
except Exception as e:
    print(f"Error: {e}")

cur.close()
conn.close()
