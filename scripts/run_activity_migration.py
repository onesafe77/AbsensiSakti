
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

with open('migrations/create_activity_events.sql', 'r') as f:
    sql = f.read()
    print("Executing SQL...")
    cur.execute(sql)
    conn.commit()
    print("Migration successful.")

cur.close()
conn.close()
