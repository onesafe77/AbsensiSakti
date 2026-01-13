
import pandas as pd
import sys
import os
import json
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

    # 0. Data Cleaning
    initial_count = len(df)
    df = df.dropna(subset=['Date', 'Time', 'Vehicle No'], how='all')
    final_count = len(df)
    print(f"Kept {final_count} valid rows.")

    # 1. Column Mapping
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
        'validated_by': 'validated_by',
        'validated_at': 'validated_at'
    }
    
    df.columns = df.columns.str.strip()
    
    # Handle duplicate column names (e.g., 'Week' and 'Week ')
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

    df = df.rename(columns=column_mapping)
    
    # Core columns for DB
    target_cols = [
        'alert_date', 'alert_time', 'vehicle_no', 'company', 'violation', 'location', 
        'opr_date', 'shift', 'week', 'month', 'coordinate', 'level', 
        'validation_status', 'validated_by', 'validated_at'
    ]
    
    # 2. Vectorized Parsing
    for col in ['alert_date', 'validated_at', 'opr_date']:
        if col in df.columns:
            df[col] = pd.to_datetime(df[col], errors='coerce')

    print("Calculating SLA and preparing records...")
    final_records = []
    
    for i, (_, row) in enumerate(df.iterrows()):
        record = {c: (row[c] if c in row and pd.notnull(row[c]) else None) for c in target_cols}
        
        # SLA Calculation
        sla = None
        try:
            if pd.notnull(record['alert_date']) and pd.notnull(record['alert_time']) and pd.notnull(record['validated_at']):
                time_str = str(record['alert_time'])
                t = pd.to_datetime(time_str).time()
                alert_dt = datetime.combine(record['alert_date'].date(), t)
                val_dt = record['validated_at']
                diff = (val_dt - alert_dt).total_seconds()
                sla = int(diff) if diff >= 0 else 0
        except: pass
        
        record['sla_seconds'] = sla
        
        # Formatting dates for SQL
        for c in ['alert_date', 'opr_date']:
            if pd.notnull(record[c]): record[c] = record[c].strftime('%Y-%m-%d')
        
        # validated_at remains as timestamp or None
        
        final_records.append(record)

    if not final_records:
        print("No valid records to insert.")
        return

    # 3. Direct SQL Insert
    print(f"Inserting {len(final_records)} records via SQL...")
    try:
        engine = create_engine(DB_URL)
        with engine.begin() as conn:
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
            is_csv = 'output=csv' in input_arg or input_arg.endswith('.csv')
            with tempfile.NamedTemporaryFile(delete=False, suffix=".csv" if is_csv else ".xlsx") as tmp:
                tmp.write(r.content)
                path = tmp.name
            ingest_file(path)
            os.remove(path)
        else:
            ingest_file(input_arg)
