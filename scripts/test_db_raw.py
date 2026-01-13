import psycopg2
import os

DB_URL = "postgresql://neondb_owner:npg_n9N1YIeLxtuj@ep-white-sound-a1v30qip-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

try:
    print("Connecting to DB raw...")
    conn = psycopg2.connect(DB_URL)
    print("Connected successfully!")
    cur = conn.cursor()
    cur.execute("SELECT 1")
    print("Query executed:", cur.fetchone())
    conn.close()
except Exception as e:
    print(f"Connection failed: {e}")
