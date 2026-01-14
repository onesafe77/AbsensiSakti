
import pandas as pd
import requests
import io

url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRpFp6S3NlTR7jWkjXVv3I2xXlfMgaDsM68GT9LFc22LR41mPn63MEAFDVCS6ef6LvY9r2BCMQI8NSX/pub?gid=0&single=true&output=csv"

print("Downloading...")
r = requests.get(url)
print("Reading CSV...")
try:
    df = pd.read_csv(io.StringIO(r.content.decode('utf-8')), dtype={'Time': str})
    print("Read CSV success")
except Exception as e:
    print(f"Read CSV failed: {e}")

print(f"Original columns: {df.columns.tolist()}")

# Attempt dedup logic
print("Stripping...")
df.columns = df.columns.str.strip()
print(f"Stripped columns: {df.columns.tolist()}")

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

# Attempt dropna
print("Dropping NA...")
subset_cols = [c for c in ['Date', 'Time', 'Vehicle No'] if c in df.columns]
if subset_cols:
    try:
        df = df.dropna(subset=subset_cols, how='all')
        print("Dropna success")
    except Exception as e:
        print(f"Dropna failed: {e}")

print("Success.")
