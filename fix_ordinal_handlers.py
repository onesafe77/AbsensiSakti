#!/usr/bin/env python3
"""
Script to fix all SIDAK POST record handlers to auto-generate ordinal field
"""

import re

# List of SIDAK types that need ordinal fix
sidak_types = [
    ('sidak-fatigue', 'SidakFatigue'),
    ('sidak-roster', 'SidakRoster'),
    ('sidak-seatbelt', 'SidakSeatbelt'),
    ('sidak-rambu', 'SidakRambu'),
    ('sidak-antrian', 'SidakAntrian'),
    ('sidak-apd', 'SidakApd'),
    ('sidak-jarak', 'SidakJarak'),
    ('sidak-kecepatan', 'SidakKecepatan'),
    ('sidak-pencahayaan', 'SidakPencahayaan'),
    ('sidak-loto', 'SidakLoto'),
    ('sidak-digital', 'SidakDigital'),
    ('sidak-workshop', 'SidakWorkshop'),
]

def fix_record_handler(content, api_path, storage_method):
    """Fix a single record POST handler to include ordinal generation."""

    # Pattern to match the handler
    # Matches: app.post("/api/sidak-xxx/:id/records", async (req, res) => {
    #   try {
    #     ... validation ...
    #     const record = await storage.createXxxRecord(validatedData);
    #     res...
    #   } catch ...
    # });

    pattern = rf'(app\.post\("{api_path}/:id/records",\s*async\s*\(req,\s*res\)\s*=>\s*\{{\s*try\s*\{{)'
    pattern += r'(.*?)'
    pattern += rf'(const\s+record\s*=\s*await\s+storage\.{storage_method}\(validatedData\);)'
    pattern += r'(.*?)'
    pattern += r'(\}\s*\}\);)'

    regex = re.compile(pattern, re.DOTALL)

    def replacer(match):
        start = match.group(1)
        middle = match.group(2)
        create_line = match.group(3)
        end_part = match.group(4)
        closing = match.group(5)

        # Check if ordinal is already being set
        if 'ordinal' in middle or 'existingRecords' in middle:
            print(f"  [SKIP] {api_path} - already has ordinal logic")
            return match.group(0)  # Return unchanged

        # Generate new middle section with ordinal logic
        # Extract sessionId extraction
        session_id_match = re.search(r'(const\s+\{\s*id\s*\}\s*=\s*req\.params;|const\s+sessionId\s*=\s*req\.params\.id;)', middle)

        if session_id_match:
            # Build new middle section
            new_middle = f"""
      const sessionId = req.params.id;
      const existingRecords = await storage.get{storage_method.replace('create', '').replace('Record', 'Records')}(sessionId);
      const ordinal = existingRecords.length + 1;
      const validatedData = insert{storage_method.replace('create', '').replace('Record', 'RecordSchema')}.parse({{ ...req.body, sessionId, ordinal }});
"""
            print(f"  [FIX] {api_path}")
            return start + new_middle + "\n      " + create_line + end_part + closing
        else:
            # Try alternative pattern
            print(f"  [PARTIAL] {api_path} - manual review needed")
            return match.group(0)

    return regex.sub(replacer, content)

def main():
    input_file = "server/routes.ts"
    output_file = "server/routes.ts"

    print("=" * 70)
    print("Fixing SIDAK record handlers to auto-generate ordinal...")
    print("=" * 70)

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    # Fix each SIDAK type
    for api_path, class_name in sidak_types:
        storage_method = f'create{class_name}Record'
        content = fix_record_handler(content, f'/api/{api_path}', storage_method)

    # Write result
    if content != original_content:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print("=" * 70)
        print("[OK] Handlers fixed successfully!")
        print("=" * 70)
    else:
        print("=" * 70)
        print("[INFO] No changes needed")
        print("=" * 70)

if __name__ == "__main__":
    main()
