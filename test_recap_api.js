// Test the recap API endpoint
async function testAPI() {
    try {
        const response = await fetch('http://localhost:5003/api/sidak-recap');
        const data = await response.json();

        console.log('API Response Status:', response.status);
        if (response.status === 500) {
            console.error('Server Error:', data.error);
            console.error('Stack:', data.stack);
            return;
        }
        console.log('Total SIDAK:', data.stats.totalSidak);
        console.log('Total Fatigue:', data.stats.totalFatigue);
        console.log('Total Roster:', data.stats.totalRoster);
        console.log('Total Seatbelt:', data.stats.totalSeatbelt);
        console.log('Total Rambu:', data.stats.totalRambu);

        const rambuSessions = data.sessions.filter(s => s.type === 'Rambu');
        console.log(`\nRambu sessions in response: ${rambuSessions.length}`);

        if (rambuSessions.length > 0) {
            console.log('\nFirst 3 Rambu sessions:');
            rambuSessions.slice(0, 3).forEach((s, i) => {
                console.log(`${i + 1}. ${s.tanggal} - ${s.lokasi} (${s.supervisorName})`);
            });
        } else {
            console.log('\n❌ NO RAMBU SESSIONS in API response!');
            console.log('Sessions types found:', [...new Set(data.sessions.map(s => s.type))]);
        }

    } catch (error) {
        console.error('Error calling API:', error.message);
    }
}

testAPI();
