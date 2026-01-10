// Script to populate Master Training data using Drizzle ORM
import 'dotenv/config';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema';

neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

const trainingData = [
  // A. Induksi & Sistem Manajemen
  { name: "Induksi KPLH Umum", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: true },
  { name: "Induksi SIMPER", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: true },
  { name: "Contractor Safety Management System (CSMS)", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: false },
  { name: "Implementasi SMKP Minerba", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: true },
  { name: "Implementasi Sistem Manajemen Keselamatan Pertambangan", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: false },
  { name: "Auditor Sistem Manajemen Keselamatan Pertambangan", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: false },
  { name: "Document Control & Filing System", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: false },
  { name: "Risk Management", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: false },
  { name: "Manajemen Lingkungan", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: false },
  { name: "Manajemen dan 3R Sampah Domestik", category: "A. INDUKSI & SISTEM MANAJEMEN", isMandatory: false },

  // B. ISO & Audit
  { name: "ISO 14001", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "ISO 45001", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "ISO 9001", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "Lead Auditor ISO 45001 (Keselamatan)", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "Lead Auditor ISO 14001 (Lingkungan)", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "Lead Auditor ISO 9001 (Mutu)", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "Internal Auditor ISO 14001", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "Internal Auditor ISO 45001", category: "B. ISO & AUDIT", isMandatory: false },
  { name: "Internal Auditor ISO 9001", category: "B. ISO & AUDIT", isMandatory: false },

  // C. K3 Umum & Keselamatan Kerja
  { name: "Identifikasi Bahaya", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: true },
  { name: "Identifikasi Bahaya dan Penilaian Risiko (IBPR)", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: true },
  { name: "Analisis Keselamatan Pekerjaan (AKA)", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Investigasi Kecelakaan", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Investigasi Kecelakaan Kerja", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Inspeksi dan Observasi", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Tanggung Jawab & Tanggung Gugat", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Pertemuan Keselamatan", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Peraturan Perundangan KPLH", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Alat Pelindung Diri (APD)", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: true },
  { name: "Basic Safety Training", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: true },
  { name: "Izin Kerja Khusus", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Fatigue Management", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: true },
  { name: "Penyakit Akibat Kerja", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Manual Handling (Ergonomi)", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },
  { name: "Pola Hidup Sehat", category: "C. K3 UMUM & KESELAMATAN KERJA", isMandatory: false },

  // D. K3 Spesifik Pekerjaan
  { name: "K3 Bejana Tekan", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "K3 Eksplorasi", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "K3 Konstruksi", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "K3 Pelabuhan", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "K3 Penanganan Bahan Kimia", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "K3 Pertambangan", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Keselamatan Jari dan Tangan", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Penyiapan Makanan", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Bekerja di Ketinggian", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Bekerja dengan Panas", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Bekerja di Ruang Terbatas", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Keselamatan Listrik", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Lockout-Tagout-Tryout (LOTOTO)", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Keselamatan Alat Angkut dan Penyangga", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Bekerja di Area Land Clearing", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Keselamatan Pekerjaan Peledakan", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Bekerja di Dekat Tebing / Dinding Galian", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Bekerja di Area Penimbunan / Disposal", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Bekerja di Dekat Air", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },
  { name: "Penanganan Ban", category: "D. K3 SPESIFIK PEKERJAAN", isMandatory: false },

  // E. Rescue, Emergency & Medical
  { name: "Dasar P3K", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: true },
  { name: "Dasar Pemadaman Api Ringan", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: true },
  { name: "Road Accident Rescue", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Water Rescue", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Medical First Responder", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Collapsed Structure Search and Rescue", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "High Angle Rescue", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Confined Space Rescue", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Incident Command System", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Pre Hospital Trauma Life Support", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Petugas P3K / First Aider", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Petugas Pemadam Kebakaran (Kelas A)", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Petugas Pemadam Kebakaran (Kelas B)", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Petugas Pemadam Kebakaran (Kelas C)", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Petugas Pemadam Kebakaran (Kelas D)", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },
  { name: "Technical Diver", category: "E. RESCUE, EMERGENCY & MEDICAL", isMandatory: false },

  // F. Lingkungan & Limbah
  { name: "Dasar Penanganan Tumpahan Hidrokarbon", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Pengendalian Pencemaran Udara (PPPU)", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Operasional Instalasi Pengendalian Pencemaran Udara (POIPPU)", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Pengendalian Pencemaran Air (PPPA)", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Pengendalian Pencemaran Limbah B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Penyimpanan Limbah B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Pengumpulan Limbah B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Pengelolaan Limbah B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Penanggung Jawab Operasional Pengolahan Air Limbah (POPAL)", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Operator Limbah B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Operator Limbah Non-B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Operator Udara", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Pelaksana TPS Limbah B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Pelaksana Pengelolaan Sampah / Limbah Padat B3", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Perlindungan Lingkungan Laut", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Keanekaragaman Hayati", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },
  { name: "Workshop Life Cycle Assessment (LCA)", category: "F. LINGKUNGAN & LIMBAH", isMandatory: false },

  // G. Tambang & Operasional
  { name: "Operator Siaga Umum / DDC", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Operator Siaga Hauling Reguler", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Operator Siaga Hauling Refreshment", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Pengawas Operasional Pertama (POP)", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Pengawas Operasional Madya (POM)", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Pengawas Operasional Utama (POU)", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Sertifikasi Juru Ukur Tambang", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Sertifikasi Kursus Juru Ledak", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Juru Bor", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Sertifikasi Eksplorasi Terperinci", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Ahli Pemodelan", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Ahli Estimasi Cadangan", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Ahli Pemodelan & Estimasi Sumberdaya Batubara", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Perencanaan Operasional Tambang Terbuka Jangka Panjang", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Perencanaan Operasional Tambang Terbuka Jangka Pendek", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Sertifikasi Pengoperasian Peralatan Penambangan", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Operator Conveyor", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },
  { name: "Pilot Drone", category: "G. TAMBANG & OPERASIONAL", isMandatory: false },

  // H. Reklamasi & Pasca Tambang
  { name: "Sertifikasi Perencanaan Reklamasi", category: "H. REKLAMASI & PASCA TAMBANG", isMandatory: false },
  { name: "Sertifikasi Pelaksanaan Reklamasi", category: "H. REKLAMASI & PASCA TAMBANG", isMandatory: false },
  { name: "Perencanaan Reklamasi dan Pasca Tambang", category: "H. REKLAMASI & PASCA TAMBANG", isMandatory: false },
  { name: "Pelaksana Reklamasi dan Pasca Tambang", category: "H. REKLAMASI & PASCA TAMBANG", isMandatory: false },
  { name: "Sertifikasi Pengelolaan Pasca Tambang", category: "H. REKLAMASI & PASCA TAMBANG", isMandatory: false },
  { name: "Teknologi Revegetasi Pasca Tambang", category: "H. REKLAMASI & PASCA TAMBANG", isMandatory: false },

  // I. Teknik, Mekanik & Konstruksi
  { name: "Inspector Scaffolding", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Welding Inspector", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Teknisi AC Residential", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Juru Ikat Beban (Rigger)", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Operator Crane", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Operator Overhead Crane", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Operator Genset", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Authorized Gas Tester", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Operator Scaffolding", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Basic Mechanic Course (BMC)", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Juru Las", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Tyre Management", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Ahli Muda K3 Konstruksi", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Ahli K3 Bekerja di Ketinggian", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Teknisi K3 Bekerja di Ketinggian", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },
  { name: "Supervisor K3 Konstruksi", category: "I. TEKNIK, MEKANIK & KONSTRUKSI", isMandatory: false },

  // J. Bangunan & Jalan
  { name: "Ahli Muda Perawatan Bangunan Gedung", category: "J. BANGUNAN & JALAN", isMandatory: false },
  { name: "Ahli Muda Teknik Bangunan Gedung", category: "J. BANGUNAN & JALAN", isMandatory: false },
  { name: "Sertifikasi Teknik Jalan", category: "J. BANGUNAN & JALAN", isMandatory: false },
  { name: "Ahli Muda Teknik Jalan", category: "J. BANGUNAN & JALAN", isMandatory: false },

  // K. Higiene Industri & Kesehatan
  { name: "Hazard Analysis Critical Control Points (HACCP)", category: "K. HIGIENE INDUSTRI & KESEHATAN", isMandatory: false },
  { name: "Ahli Higiene Industri Muda (HIMU)", category: "K. HIGIENE INDUSTRI & KESEHATAN", isMandatory: false },
  { name: "Ahli Higiene Industri Madya (HIMA)", category: "K. HIGIENE INDUSTRI & KESEHATAN", isMandatory: false },
  { name: "Petugas Industrial Hygiene", category: "K. HIGIENE INDUSTRI & KESEHATAN", isMandatory: false },
  { name: "Juru Rawat / Paramedis (HIPERKES)", category: "K. HIGIENE INDUSTRI & KESEHATAN", isMandatory: false },
  { name: "Pembinaan Medical Check Up & Fit to Work", category: "K. HIGIENE INDUSTRI & KESEHATAN", isMandatory: false },

  // L. Kelistrikan
  { name: "Ahli K3 Kelistrikan", category: "L. KELISTRIKAN", isMandatory: false },
  { name: "Teknisi K3 Kelistrikan", category: "L. KELISTRIKAN", isMandatory: false },
  { name: "Teknisi Muda Pengoperasian Distribusi Tenaga Listrik", category: "L. KELISTRIKAN", isMandatory: false },
  { name: "Teknisi Muda Pengoperasian Distribusi Tegangan Menengah", category: "L. KELISTRIKAN", isMandatory: false },
  { name: "Teknisi Muda Pengoperasian Distribusi Tegangan Rendah", category: "L. KELISTRIKAN", isMandatory: false },
  { name: "Teknisi Muda Pemeliharaan Distribusi Tegangan Menengah", category: "L. KELISTRIKAN", isMandatory: false },
  { name: "Teknisi Muda Pemeliharaan Distribusi Tegangan Rendah", category: "L. KELISTRIKAN", isMandatory: false },

  // M. ISPS & Maritim
  { name: "CSO ISPS Code", category: "M. ISPS & MARITIM", isMandatory: false },
  { name: "PFSO ISPS Code", category: "M. ISPS & MARITIM", isMandatory: false },
  { name: "Risk Assessment ISM Code", category: "M. ISPS & MARITIM", isMandatory: false },

  // N. Rescue & Sertifikasi Nasional (SKKNI)
  { name: "CSSR - SKKNI", category: "N. RESCUE & SERTIFIKASI NASIONAL (SKKNI)", isMandatory: false },
  { name: "Confined Space Rescue - SKKNI", category: "N. RESCUE & SERTIFIKASI NASIONAL (SKKNI)", isMandatory: false },
  { name: "Penyelamatan di Ketinggian (HART) - SKKNI", category: "N. RESCUE & SERTIFIKASI NASIONAL (SKKNI)", isMandatory: false },
  { name: "Penyelamatan di Kecelakaan Kendaraan (RAR) - SKKNI", category: "N. RESCUE & SERTIFIKASI NASIONAL (SKKNI)", isMandatory: false },
  { name: "Sistem Penyelamatan Pertambangan - SKKNI", category: "N. RESCUE & SERTIFIKASI NASIONAL (SKKNI)", isMandatory: false },
  { name: "Rope Access Technician Level 1", category: "N. RESCUE & SERTIFIKASI NASIONAL (SKKNI)", isMandatory: false },
  { name: "Basic Open Mine Rescue (BASARNAS)", category: "N. RESCUE & SERTIFIKASI NASIONAL (SKKNI)", isMandatory: false },
];

async function populateTrainings() {
  console.log('🚀 Starting to populate Master Training data...');
  console.log(`📊 Total trainings to insert: ${trainingData.length}`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const training of trainingData) {
    try {
      await db.insert(schema.trainings).values({
        name: training.name,
        category: training.category,
        description: '',
        isMandatory: training.isMandatory,
        isActive: true
      }).onConflictDoNothing();
      inserted++;
      if (inserted % 30 === 0) {
        console.log(`✅ Inserted ${inserted}/${trainingData.length} trainings...`);
      }
    } catch (error: any) {
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        skipped++;
      } else {
        errors++;
        console.error(`❌ Error inserting "${training.name}": ${error.message}`);
      }
    }
  }

  console.log('\n========================================');
  console.log(`✅ Successfully processed: ${inserted} trainings`);
  console.log(`⏭️  Skipped (duplicate): ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('========================================');

  await pool.end();
  process.exit(0);
}

populateTrainings().catch(console.error);
