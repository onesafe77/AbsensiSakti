
import os
import psycopg2
from urllib.parse import urlparse

# Get DATABASE_URL
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    # Fallback/Hardcode if env not present in shell but accessible elsewhere
    # Try reading .env file manually
    try:
        with open("c:/OneTalent/.env", "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    db_url = line.strip().split("=", 1)[1]
                    break
    except Exception as e:
        print(f"Error reading .env: {e}")

if not db_url:
    print("DATABASE_URL not found.")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    print("Adding reminder_sent column to activity_events...")
    
    # Check if column exists first
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='activity_events' AND column_name='reminder_sent';
    """)
    if cursor.fetchone():
        print("Column reminder_sent already exists.")
    else:
        cursor.execute("ALTER TABLE activity_events ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;")
        conn.commit()
        print("Column reminder_sent added successfully.")
        
    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
