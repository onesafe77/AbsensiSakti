
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DB_URL = os.getenv("DATABASE_URL")

try:
    print(f"Connecting to DB...")
    with psycopg.connect(DB_URL) as conn:
        with conn.cursor() as cur:
            print("Inserting test row...")
            cur.execute("""
                INSERT INTO fms_fatigue_alerts 
                (alert_date, alert_time, vehicle_no, week, month) 
                VALUES 
                (%s, %s, %s, %s, %s)
            """, ('2026-01-13', '02:00:00', 'TEST_VEHICLE', 99, 'TestMonth'))
            conn.commit()
            print("SUCCESS! Test row inserted.")
            
except Exception as e:
    print(f"ERROR: {e}")
