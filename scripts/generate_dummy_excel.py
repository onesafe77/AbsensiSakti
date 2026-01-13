import pandas as pd
from datetime import datetime

data = {
    'Date': ['2023-10-26', '2023-10-26'],
    'Time': ['10:00:00', '11:30:00'],
    'Vehicle No': ['DT-01', 'DT-02'],
    'Company': ['PT. TEST', 'PT. DEMO'],
    'Violation': ['Fatigue', 'Distraction'],
    'Location': ['Pit A', 'Pit B'],
    'Date Opr': ['2023-10-26', '2023-10-26'],
    'Shift': ['Day', 'Day'],
    'Week': [43, 43],
    'Month': [10, 10],
    'Coordinate': ['-2.0, 115.0', '-2.1, 115.1'],
    'Level': ['Medium', 'High'],
    'validation_status': ['Valid', 'Belum Validasi'],
    'validated_by': ['Supervisor A', None],
    'validated_at': ['2023-10-26 10:05:00', None]
}

df = pd.DataFrame(data)
df.to_excel('dummy_fatigue.xlsx', index=False)
print("Dummy Excel created: dummy_fatigue.xlsx")
