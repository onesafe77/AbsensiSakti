
import pandas as pd
import sys
import os
import traceback
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Database Connection
DB_URL = os.getenv("DATABASE_URL")
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://")

if not DB_URL:
    print("Error: DATABASE_URL not found in .env")
    sys.exit(1)

def ingest_file(file_path):
    print(f"Reading {file_path}...")
    
    try:
        if file_path.endswith('.csv'):
             df = pd.read_csv(file_path, dtype={'Time': str})
        else:
             df = pd.read_excel(file_path, dtype={'Time': str})
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    print(f"Loaded {len(df)} rows. Columns: {df.columns.tolist()}")

    # 1. Deduplicate Columns (Critical Step)
    df.columns = df.columns.str.strip()
    new_cols = []
    seen = {}
    for col in df.columns:
        if col in seen:
            seen[col] += 1
            new_cols.append(f"{col}_{seen[col]}")
        else:
            seen[col] = 0
            new_cols.append(col)
    df.columns = new_cols
    print(f"Deduplicated columns: {df.columns.tolist()}")

    # 2. Data Cleaning
    initial_count = len(df)
    # Safely check for subset columns
    subset_cols = [c for c in ['Date', 'Time', 'Vehicle No'] if c in df.columns]
    if subset_cols:
        df = df.dropna(subset=subset_cols, how='all')
    final_count = len(df)
    print(f"Kept {final_count} valid rows.")

    # 2.5 Drop conflicting columns if they exist
    # If we are mapping 'Pengawas FMS' to 'validated_by', we must drop existing 'validated_by'
    if 'Pengawas FMS' in df.columns and 'validated_by' in df.columns:
        print("Dropping original 'validated_by' to replace with 'Pengawas FMS'...")
        df = df.drop(columns=['validated_by'])

    # 3. Column Mapping
    column_mapping = {
        'Date': 'alert_date',
        'Time': 'alert_time',
        'Vehicle No': 'vehicle_no',
        'Company': 'company',
        'Violation': 'violation',
        'Location': 'location',
        'Date Opr': 'opr_date',
        'Shift': 'shift',
        'Week': 'week',
        'Month': 'month',
        'Coordinate': 'coordinate',
        'Level': 'level',
        'validation_status': 'validation_status',
        'Pengawas FMS': 'validated_by', # Map correct supervisor column
        'validated_at': 'validated_at'
    }
    
    df = df.rename(columns=column_mapping)
    
    # Core columns for DB
    target_cols = [
        'alert_date', 'alert_time', 'vehicle_no', 'company', 'violation', 'location', 
        'opr_date', 'shift', 'week', 'month', 'coordinate', 'level', 
        'validation_status', 'validated_by', 'validated_at'
    ]
    
    # 4. Parsing Dates
    for col in ['alert_date', 'validated_at', 'opr_date']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')

    print("Calculating SLA and preparing records...")
    final_records = []
    
    for i, (_, row) in enumerate(df.iterrows()):
        # Handle missing columns gracefully
        record = {}
        for c in target_cols:
            if c in row and pd.notnull(row[c]):
                record[c] = row[c]
            else:
                record[c] = None
        
        # SLA Calculation
        sla = None
        try:
            if pd.notnull(record['alert_date']) and pd.notnull(record['alert_time']) and pd.notnull(record['validated_at']):
                time_str = str(record['alert_time'])
                # Handle time formats
                try:
                    t = pd.to_datetime(time_str).time()
                except:
                    # Fallback for weird time formats if any
                    t = datetime.strptime(time_str, "%H:%M:%S").time()

                alert_dt = datetime.combine(record['alert_date'].date(), t)
                val_dt = record['validated_at']
                diff = (val_dt - alert_dt).total_seconds()
                sla = int(diff) if diff >= 0 else 0
        except Exception: 
            pass # SLA calc failure should not stop ingestion
        
        record['sla_seconds'] = sla
        
        # Formatting dates for SQL
        for c in ['alert_date', 'opr_date']:
            if pd.notnull(record[c]): record[c] = record[c].strftime('%Y-%m-%d')
        
        final_records.append(record)

    if not final_records:
        print("No valid records to insert.")
        return

    # 5. Direct SQL Insert with TRUNCATE
    print(f"Inserting {len(final_records)} records via SQL...")
    try:
        engine = create_engine(DB_URL)
        with engine.begin() as conn:
            # Clear existing data to prevent duplicates
            print("Clearing existing data (TRUNCATE)...")
            conn.execute(text("TRUNCATE TABLE fms_fatigue_alerts"))

            # Construct dynamic query
            cols = target_cols + ['sla_seconds']
            col_list = ", ".join(cols)
            placeholders = ", ".join([f":{c}" for c in cols])
            sql = f"INSERT INTO fms_fatigue_alerts ({col_list}) VALUES ({placeholders})"
            
            # Insert in chunks of 500
            for k in range(0, len(final_records), 500):
                chunk = final_records[k:k+500]
                conn.execute(text(sql), chunk)
                print(f"Inserted batch {k//500 + 1}...")
                
        print("SUCCESS: Data fully ingested.")
    except Exception as e:
        print("DATABASE ERROR:")
        traceback.print_exc()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ingest_fatigue.py <path_or_url>")
    else:
        input_arg = sys.argv[1]
        if input_arg.startswith("http"):
            import requests, tempfile
            print(f"Downloading {input_arg}...")
            r = requests.get(input_arg)
            # Check content type or extension from url
            is_csv = 'output=csv' in input_arg or input_arg.endswith('.csv')
            with tempfile.NamedTemporaryFile(delete=False, suffix=".csv" if is_csv else ".xlsx") as tmp:
                tmp.write(r.content)
                path = tmp.name
            try:
                ingest_file(path)
            finally:
                if os.path.exists(path):
                    os.remove(path)
        else:
            ingest_file(input_arg)
