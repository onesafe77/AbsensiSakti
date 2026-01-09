
// Web Worker for Fatigue Dashboard Aggregation

self.onmessage = function (e: MessageEvent) {
    const { type, payload } = e.data;
    if (type === 'PROCESS_DATA') {
        processData(payload.rawData, payload.roster);
    }
};

function processData(rows: any[], roster: any) {
    const processedRows: any[] = [];
    let validCount = 0;

    rows.forEach(row => {
        // 1. Parsing (WITA assumed +8 UTC relative)
        // Helper to parse Excel time
        let alertDate = new Date(row['Date']);
        if (isNaN(alertDate.getTime())) return;

        // Handle Time parsing (Excel fraction or string)
        let timeStr = row['Time'];
        if (typeof timeStr === 'number') {
            const totalSeconds = Math.floor(timeStr * 86400);
            const hrs = Math.floor(totalSeconds / 3600);
            const min = Math.floor((totalSeconds % 3600) / 60);
            const sec = totalSeconds % 60;
            alertDate.setHours(hrs, min, sec);
        } else if (typeof timeStr === 'string') {
            const parts = timeStr.trim().split(':');
            if (parts.length >= 2) {
                alertDate.setHours(parseInt(parts[0]), parseInt(parts[1]), parts[2] ? parseInt(parts[2]) : 0);
            }
        }

        // 2. Week Calculation (Custom Anchor Sunday)
        const oprDateStr = row['Date Opr'] || row['Date'];
        const oprDate = new Date(oprDateStr);
        if (isNaN(oprDate.getTime())) return;

        const year = oprDate.getFullYear();
        const jan1 = new Date(year, 0, 1);
        const anchorSunday = new Date(jan1);
        anchorSunday.setDate(jan1.getDate() - jan1.getDay()); // Go back to Sunday

        const diffTime = Math.abs(oprDate.getTime() - anchorSunday.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const weekNum = Math.floor((diffDays - 1) / 7) + 1;

        // 3. Mapping Roster
        const shift = row['Shift'] ? row['Shift'].toString().toUpperCase() : 'UNKNOWN';
        let supervisor = 'Belum Diset';
        const rosterKey = `Week ${weekNum}`;

        // Robust Roster Check
        if (roster && roster[rosterKey]) {
            if (shift.includes('1') || shift.includes('SIANG')) supervisor = roster[rosterKey]['Shift 1'] || 'Belum Diset';
            else if (shift.includes('2') || shift.includes('MALAM')) supervisor = roster[rosterKey]['Shift 2'] || 'Belum Diset';
        }

        // 4. Validation Calculation
        let slaSeconds = null;
        let category = 'Belum Validasi';
        let status = 'Unvalidated';
        let validatedAt = null;

        if (row['validated_at']) {
            validatedAt = new Date(row['validated_at']);
            // If validated_at suggests UTC but context is WITA, we might need offset adjustment?
            // For now assuming raw string is consistent with Date.

            if (!isNaN(validatedAt.getTime())) {
                slaSeconds = (validatedAt.getTime() - alertDate.getTime()) / 1000;

                if (slaSeconds < 300) { category = 'Validasi < 5 Menit'; status = 'Fast'; }
                else if (slaSeconds < 600) { category = 'Validasi > 5 Menit'; status = 'Slow'; }
                else if (slaSeconds < 900) { category = 'Validasi > 10 Menit'; status = 'Slow'; }
                else { category = 'Validasi > 15 Menit'; status = 'Slow'; }
            }
        }

        // 5. Build Processed Row
        const pRow = {
            week: weekNum,
            shift: shift,
            supervisor: supervisor,
            category: category,
            status: status,
            slaSeconds: slaSeconds,
            hour: validatedAt ? validatedAt.getHours() : alertDate.getHours(),
            location: row['Location'],
            vehicle: row['Vehicle No'] || row['Vehicle'] || row['Unit'], // Flexibility
            id: validCount // ID for key
        };
        processedRows.push(pRow);
        validCount++;
    });

    self.postMessage({ type: 'DATA_PROCESSED', rows: processedRows, count: validCount });
}
