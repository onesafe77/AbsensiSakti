import "dotenv/config";
import { db } from "../server/db";
import { employees } from "../shared/schema";
import { sql } from "drizzle-orm";

async function checkMissingData() {
    console.log("🔍 Menganalisa data karyawan yang kosong... (Env loaded)\n");

    const allEmployees = await db.select().from(employees);
    const total = allEmployees.length;

    console.log(`Total Karyawan: ${total} orang\n`);

    const missingStats = {
        phone: 0,
        isafeNumber: 0,
        idItws: 0,
        department: 0,
        position: 0,
        dob: 0, // Tanggal Lahir
        ktpNo: 0,
        simNo: 0,
        address: 0,
        domisiliKaryawan: 0
    };

    const sampleMissingIds: Record<string, string[]> = {};

    for (const emp of allEmployees) {
        if (!emp.phone || emp.phone === '-' || emp.phone.length < 5) {
            missingStats.phone++;
            if (!sampleMissingIds['phone']) sampleMissingIds['phone'] = [];
            if (sampleMissingIds['phone'].length < 3) sampleMissingIds['phone'].push(`${emp.name} (${emp.id})`);
        }

        if (!emp.isafeNumber) {
            missingStats.isafeNumber++;
            if (!sampleMissingIds['isafeNumber']) sampleMissingIds['isafeNumber'] = [];
            if (sampleMissingIds['isafeNumber'].length < 3) sampleMissingIds['isafeNumber'].push(`${emp.name} (${emp.id})`);
        }

        if (!emp.idItws) missingStats.idItws++;
        if (!emp.department) missingStats.department++;
        if (!emp.position) missingStats.position++;
        if (!emp.dob) missingStats.dob++;
        if (!emp.ktpNo) missingStats.ktpNo++;

        if (!emp.simNo) {
            missingStats.simNo++;
            if (!sampleMissingIds['simNo']) sampleMissingIds['simNo'] = [];
            if (sampleMissingIds['simNo'].length < 3) sampleMissingIds['simNo'].push(`${emp.name} (${emp.id})`);
        }

        if (!emp.address) missingStats.address++;
        if (!emp.domisiliKaryawan) missingStats.domisiliKaryawan++;
    }

    console.log("📊 RINGKASAN DATA KOSONG:");
    console.log("------------------------------------------------");

    console.log(`- No HP/WA Kosong: \t${missingStats.phone} orang (${Math.round(missingStats.phone / total * 100)}%)`);
    if (missingStats.phone > 0) console.log(`  (Contoh: ${sampleMissingIds['phone']?.join(', ')})`);

    console.log(`- ISAFE Number Kosong: \t${missingStats.isafeNumber} orang (${Math.round(missingStats.isafeNumber / total * 100)}%)`);
    if (missingStats.isafeNumber > 0) console.log(`  (Contoh: ${sampleMissingIds['isafeNumber']?.join(', ')})`);

    console.log(`- ID ITWS Kosong: \t${missingStats.idItws} orang`);
    console.log(`- Departemen Kosong: \t${missingStats.department} orang`);
    console.log(`- Jabatan/Posisi Kosong: \t${missingStats.position} orang`);
    console.log(`- Tanggal Lahir (DOB) Kosong: ${missingStats.dob} orang`);
    console.log(`- No KTP Kosong: \t${missingStats.ktpNo} orang`);
    console.log(`- No SIM Kosong: \t${missingStats.simNo} orang`);
    console.log(`- Alamat Kosong: \t${missingStats.address} orang`);
    console.log(`- Domisili Kosong: \t${missingStats.domisiliKaryawan} orang`);

    console.log("\n------------------------------------------------");
    console.log("💡 REKOMENDASI:");
    if (missingStats.isafeNumber > total * 0.5) {
        console.log("⚠️ Sebagian besar data ISAFE Number belum ada. Prioritaskan update kolom 'ISAFE Number' di Excel.");
    }
    if (missingStats.phone > 0) {
        console.log("⚠️ Data No HP penting untuk fitur WhatsApp notifikasi.");
    }
}

checkMissingData().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});
