import 'dotenv/config';
import { db } from "./db";
import { trainings } from "@shared/schema";
import { eq } from "drizzle-orm";

interface TrainingCategory {
    category: string;
    items: string[];
}

const masterTrainingData: TrainingCategory[] = [
    {
        category: "A. Induksi & Sistem Manajemen",
        items: [
            "Induksi KPLH Umum",
            "Induksi SIMPER",
            "Contractor Safety Management System (CSMS)",
            "Implementasi SMKP Minerba",
            "Implementasi Sistem Manajemen Keselamatan Pertambangan",
            "Auditor Sistem Manajemen Keselamatan Pertambangan",
            "Document Control & Filing System",
            "Risk Management",
            "Manajemen Lingkungan",
            "Manajemen dan 3R Sampah Domestik"
        ]
    },
    {
        category: "B. ISO & Audit",
        items: [
            "ISO 14001",
            "ISO 45001",
            "ISO 9001",
            "Lead Auditor ISO 45001 (Keselamatan)",
            "Lead Auditor ISO 14001 (Lingkungan)",
            "Lead Auditor ISO 9001 (Mutu)",
            "Internal Auditor ISO 14001",
            "Internal Auditor ISO 45001",
            "Internal Auditor ISO 9001"
        ]
    },
    {
        category: "C. K3 Umum & Keselamatan Kerja",
        items: [
            "Identifikasi Bahaya",
            "Identifikasi Bahaya dan Penilaian Risiko (IBPR)",
            "Analisis Keselamatan Pekerjaan (AKA)",
            "Investigasi Kecelakaan",
            "Investigasi Kecelakaan Kerja",
            "Inspeksi dan Observasi",
            "Tanggung Jawab & Tanggung Gugat",
            "Pertemuan Keselamatan",
            "Peraturan Perundangan KPLH",
            "Alat Pelindung Diri (APD)",
            "Basic Safety Training",
            "Izin Kerja Khusus",
            "Fatigue Management",
            "Penyakit Akibat Kerja",
            "Manual Handling (Ergonomi)",
            "Pola Hidup Sehat"
        ]
    },
    {
        category: "D. K3 Spesifik Pekerjaan",
        items: [
            "K3 Bejana Tekan",
            "K3 Eksplorasi",
            "K3 Konstruksi",
            "K3 Pelabuhan",
            "K3 Penanganan Bahan Kimia",
            "K3 Pertambangan",
            "Keselamatan Jari dan Tangan",
            "Penyiapan Makanan",
            "Bekerja di Ketinggian",
            "Bekerja dengan Panas",
            "Bekerja di Ruang Terbatas",
            "Keselamatan Listrik",
            "Lockout–Tagout–Tryout (LOTOTO)",
            "Keselamatan Alat Angkut dan Penyangga",
            "Bekerja di Area Land Clearing",
            "Keselamatan Pekerjaan Peledakan",
            "Bekerja di Dekat Tebing / Dinding Galian",
            "Bekerja di Area Penimbunan / Disposal",
            "Bekerja di Dekat Air",
            "Penanganan Ban"
        ]
    },
    {
        category: "E. Rescue, Emergency & Medical",
        items: [
            "Dasar P3K",
            "Dasar Pemadaman Api Ringan",
            "Road Accident Rescue",
            "Water Rescue",
            "Medical First Responder",
            "Collapsed Structure Search and Rescue",
            "High Angle Rescue",
            "Confined Space Rescue",
            "Incident Command System",
            "Pre Hospital Trauma Life Support",
            "Petugas P3K / First Aider",
            "Petugas Pemadam Kebakaran (Kelas A)",
            "Petugas Pemadam Kebakaran (Kelas B)",
            "Petugas Pemadam Kebakaran (Kelas C)",
            "Petugas Pemadam Kebakaran (Kelas D)",
            "Technical Diver"
        ]
    },
    {
        category: "F. Lingkungan & Limbah",
        items: [
            "Dasar Penanganan Tumpahan Hidrokarbon",
            "Penanggung Jawab Pengendalian Pencemaran Udara (PPPU)",
            "Penanggung Jawab Operasional Instalasi Pengendalian Pencemaran Udara (POIPPU)",
            "Penanggung Jawab Pengendalian Pencemaran Air (PPPA)",
            "Penanggung Jawab Pengendalian Pencemaran Limbah B3",
            "Penanggung Jawab Penyimpanan Limbah B3",
            "Penanggung Jawab Pengumpulan Limbah B3",
            "Penanggung Jawab Pengelolaan Limbah B3",
            "Penanggung Jawab Operasional Pengolahan Air Limbah (POPAL)",
            "Operator Limbah B3",
            "Operator Limbah Non-B3",
            "Operator Udara",
            "Pelaksana TPS Limbah B3",
            "Pelaksana Pengelolaan Sampah / Limbah Padat B3",
            "Perlindungan Lingkungan Laut",
            "Keanekaragaman Hayati",
            "Workshop Life Cycle Assessment (LCA)"
        ]
    },
    {
        category: "G. Tambang & Operasional",
        items: [
            "Operator Siaga Umum / DDC",
            "Operator Siaga Hauling Reguler",
            "Operator Siaga Hauling Refreshment",
            "Pengawas Operasional Pertama (POP)",
            "Pengawas Operasional Madya (POM)",
            "Pengawas Operasional Utama (POU)",
            "Sertifikasi Juru Ukur Tambang",
            "Sertifikasi Kursus Juru Ledak",
            "Juru Bor",
            "Sertifikasi Eksplorasi Terperinci",
            "Ahli Pemodelan",
            "Ahli Estimasi Cadangan",
            "Ahli Pemodelan & Estimasi Sumberdaya Batubara",
            "Perencanaan Operasional Tambang Terbuka Jangka Panjang",
            "Perencanaan Operasional Tambang Terbuka Jangka Pendek",
            "Sertifikasi Pengoperasian Peralatan Penambangan",
            "Operator Conveyor",
            "Pilot Drone"
        ]
    },
    {
        category: "H. Reklamasi & Pasca Tambang",
        items: [
            "Sertifikasi Perencanaan Reklamasi",
            "Sertifikasi Pelaksanaan Reklamasi",
            "Perencanaan Reklamasi dan Pasca Tambang",
            "Pelaksana Reklamasi dan Pasca Tambang",
            "Sertifikasi Pengelolaan Pasca Tambang",
            "Teknologi Revegetasi Pasca Tambang"
        ]
    },
    {
        category: "I. Teknik, Mekanik & Konstruksi",
        items: [
            "Inspector Scaffolding",
            "Welding Inspector",
            "Teknisi AC Residential",
            "Juru Ikat Beban (Rigger)",
            "Operator Crane",
            "Operator Overhead Crane",
            "Operator Genset",
            "Authorized Gas Tester",
            "Operator Scaffolding",
            "Basic Mechanic Course (BMC)",
            "Juru Las",
            "Tyre Management",
            "Ahli Muda K3 Konstruksi",
            "Ahli K3 Bekerja di Ketinggian",
            "Teknisi K3 Bekerja di Ketinggian",
            "Supervisor K3 Konstruksi"
        ]
    },
    {
        category: "J. Bangunan & Jalan",
        items: [
            "Ahli Muda Perawatan Bangunan Gedung",
            "Ahli Muda Teknik Bangunan Gedung",
            "Sertifikasi Teknik Jalan",
            "Ahli Muda Teknik Jalan"
        ]
    },
    {
        category: "K. Higiene Industri & Kesehatan",
        items: [
            "Hazard Analysis Critical Control Points (HACCP)",
            "Ahli Higiene Industri Muda (HIMU)",
            "Ahli Higiene Industri Madya (HIMA)",
            "Petugas Industrial Hygiene",
            "Juru Rawat / Paramedis (HIPERKES)",
            "Pembinaan Medical Check Up & Fit to Work"
        ]
    },
    {
        category: "L. Kelistrikan",
        items: [
            "Ahli K3 Kelistrikan",
            "Teknisi K3 Kelistrikan",
            "Teknisi Muda Pengoperasian Distribusi Tenaga Listrik",
            "Teknisi Muda Pengoperasian Distribusi Tegangan Menengah",
            "Teknisi Muda Pengoperasian Distribusi Tegangan Rendah",
            "Teknisi Muda Pemeliharaan Distribusi Tegangan Menengah",
            "Teknisi Muda Pemeliharaan Distribusi Tegangan Rendah"
        ]
    },
    {
        category: "M. ISPS & Maritim",
        items: [
            "CSO ISPS Code",
            "PFSO ISPS Code",
            "Risk Assessment ISM Code"
        ]
    },
    {
        category: "N. Rescue & Sertifikasi Nasional (SKKNI)",
        items: [
            "CSSR – SKKNI",
            "Confined Space Rescue – SKKNI",
            "Penyelamatan di Ketinggian (HART) – SKKNI",
            "Penyelamatan di Kecelakaan Kendaraan (RAR) – SKKNI",
            "Sistem Penyelamatan Pertambangan – SKKNI",
            "Rope Access Technician Level 1",
            "Basic Open Mine Rescue (BASARNAS)"
        ]
    }
];

async function populateTrainings() {
    console.log("📚 Starting Master Training Population...");

    let insertedCount = 0;
    let skippedCount = 0;

    for (const group of masterTrainingData) {
        console.log(`\nProcessing Category: ${group.category}`);

        for (const itemName of group.items) {
            try {
                // Check if training already exists
                const existing = await db.select().from(trainings).where(eq(trainings.name, itemName));

                if (existing.length > 0) {
                    console.log(`  ⚠ Skipped (Already exists): ${itemName}`);
                    skippedCount++;
                } else {
                    await db.insert(trainings).values({
                        name: itemName,
                        category: group.category,
                        isActive: true,
                        isMandatory: false // Default to false
                    });
                    console.log(`  ✅ Inserted: ${itemName}`);
                    insertedCount++;
                }
            } catch (error: any) {
                console.error(`  ❌ Failed to insert ${itemName}:`, error.message);
            }
        }
    }

    console.log("\n===========================================");
    console.log("             POPULATION SUMMARY            ");
    console.log("===========================================");
    console.log(`Total Categories : ${masterTrainingData.length}`);
    console.log(`Inserted         : ${insertedCount}`);
    console.log(`Skipped          : ${skippedCount}`);
    console.log("===========================================");
}

populateTrainings().catch(console.error).finally(() => process.exit(0));
