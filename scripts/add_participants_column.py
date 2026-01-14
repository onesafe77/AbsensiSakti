
import os
import psycopg2

# Get DATABASE_URL
db_url = os.environ.get("DATABASE_URL")
if not db_url:
    try:
        with open("c:/OneTalent/.env", "r") as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    db_url = line.strip().split("=", 1)[1]
                    break
    except Exception:
        pass

if not db_url:
    print("DATABASE_URL not found.")
    exit(1)

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    
    print("Adding participants column to activity_events...")
    
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='activity_events' AND column_name='participants';
    """)
    if cursor.fetchone():
        print("Column participants already exists.")
    else:
        cursor.execute("ALTER TABLE activity_events ADD COLUMN participants TEXT;")
        conn.commit()
        print("Column participants added successfully.")
        
    cursor.close()
    conn.close()

except Exception as e:
    print(f"Error: {e}")
