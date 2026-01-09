# 7 SIDAK Forms - Complete Implementation Guide

## Overview
This guide provides complete code for implementing all 7 new SIDAK forms following the exact same pattern as existing forms (Roster, Rambu, Fatigue, Seatbelt).

## Forms to Implement:
1. Observasi Antrian
2. Observasi Jarak Aman  
3. Observasi Kecepatan
4. Pemeriksaan Pencahayaan
5. Inspeksi Kepatuhan LOTO
6. Inspeksi Pengawas Digital
7. Checklist Peralatan Workshop

---

## Step 1: Database Schemas (schema.ts)

### Add all 7 schemas at END of `shared/schema.ts` (before the export statement):

```typescript
// ============================================================================
// SIDAK ANTRIAN (Queue Observation) - ALREADY ADDED ✅
// ============================================================================

// ============================================================================ 
// SIDAK JARAK AMAN (Safe Distance Observation)
// ============================================================================

export const sidakJarakSessions = pgTable("sidak_jarak_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tanggal: varchar("tanggal").notNull(),
  shift: varchar("shift").notNull(),
  waktu: varchar("waktu").notNull(),
  lokasi: text("lokasi").notNull(),
  totalSampel: integer("total_sampel").notNull().default(0),
  persenKepatuhan: integer("persen_kepatuhan").default(0),
  activityPhotos: text("activity_photos").array(),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_jarak_sessions_created_by").on(table.createdBy)]);

export const sidakJarakRecords = pgTable("sidak_jarak_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sidakJarakSessions.id, { onDelete: "cascade" }),
  ordinal: integer("ordinal").notNull(),
  noKendaraan: varchar("no_kendaraan").notNull(),
  tipeUnit: varchar("tipe_unit"),
  lokasiMuatan: varchar("lokasi_muatan"),
  lokasiKosongan: varchar("lokasi_kosongan"),
  nomorLambungUnit: varchar("nomor_lambung_unit"),
  jarakAktualKedua: varchar("jarak_aktual_kedua"),
  keteranganTandaTangan: text("keterangan_tanda_tangan"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_jarak_records_session").on(table.sessionId)]);

export const sidakJarakObservers = pgTable("sidak_jarak_observers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sidakJarakSessions.id, { onDelete: "cascade" }),
  ordinal: integer("ordinal").notNull(),
  nama: text("nama").notNull(),
  perusahaan: text("perusahaan"),
  tandaTangan: text("tanda_tangan"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_jarak_observers_session").on(table.sessionId)]);

export const insertSidakJarakSessionSchema = createInsertSchema(sidakJarakSessions).omit({ id: true, createdAt: true, totalSampel: true });
export const insertSidakJarakRecordSchema = createInsertSchema(sidakJarakRecords).omit({ id: true, createdAt: true });
export const insertSidakJarakObserverSchema = createInsertSchema(sidakJarakObservers).omit({ id: true, createdAt: true });

export type SidakJarakSession = typeof sidakJarakSessions.$inferSelect;
export type InsertSidakJarakSession = z.infer<typeof insertSidakJarakSessionSchema>;
export type SidakJarakRecord = typeof sidakJarakRecords.$inferSelect;
export type InsertSidakJarakRecord = z.infer<typeof insertSidakJarakRecordSchema>;
export type SidakJarakObserver = typeof sidakJarakObservers.$inferSelect;
export type InsertSidakJarakObserver = z.infer<typeof insertSidakJarakObserverSchema>;

// ============================================================================
// SIDAK KECEPATAN (Speed Observation)
// ============================================================================

export const sidakKecepatanSessions = pgTable("sidak_kecepatan_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tanggal: varchar("tanggal").notNull(),
  shift: varchar("shift").notNull(),
  waktu: varchar("waktu").notNull(),
  lokasi: text("lokasi").notNull(),
  totalSampel: integer("total_sampel").notNull().default(0),
  subLokasi: text("sub_lokasi"),
  batasKecepatanKph: integer("batas_kecepatan_kph"),
  activityPhotos: text("activity_photos").array(),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_kecepatan_sessions_created_by").on(table.createdBy)]);

export const sidakKecepatanRecords = pgTable("sidak_kecepatan_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sidakKecepatanSessions.id, { onDelete: "cascade" }),
  ordinal: integer("ordinal").notNull(),
  noKendaraan: varchar("no_kendaraan").notNull(),
  tipeUnit: varchar("tipe_unit"),
  arahKendaraanMuatan: varchar("arah_kendaraan_muatan"),
  arahKendaraanKosongan: varchar("arah_kendaraan_kosongan"),
  kecepatanAktualMph: integer("kecepatan_aktual_mph"),
  kecepatanAktualKph: integer("kecepatan_aktual_kph"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_kecepatan_records_session").on(table.sessionId)]);

export const sidakKecepatanObservers = pgTable("sidak_kecepatan_observers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sidakKecepatanSessions.id, { onDelete: "cascade" }),
  ordinal: integer("ordinal").notNull(),
  nama: text("nama").notNull(),
  nik: varchar("nik"),
  perusahaan: text("perusahaan"),
  tandaTangan: text("tanda_tangan"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_kecepatan_observers_session").on(table.sessionId)]);

export const insertSidakKecepatanSessionSchema = createInsertSchema(sidakKecepatanSessions).omit({ id: true, createdAt: true, totalSampel: true });
export const insertSidakKecepatanRecordSchema = createInsertSchema(sidakKecepatanRecords).omit({ id: true, createdAt: true });
export const insertSidakKecepatanObserverSchema = createInsertSchema(sidakKecepatanObservers).omit({ id: true, createdAt: true });

export type SidakKecepatanSession = typeof sidakKecepatanSessions.$inferSelect;
export type InsertSidakKecepatanSession = z.infer<typeof insertSidakKecepatanSessionSchema>;
export type SidakKecepatanRecord = typeof sidakKecepatanRecords.$inferSelect;
export type InsertSidakKecepatanRecord = z.infer<typeof insertSidakKecepatanRecordSchema>;
export type SidakKecepatanObserver = typeof sidakKecepatanObservers.$inferSelect;
export type InsertSidakKecepatanObserver = z.infer<typeof insertSidakKecepatanObserverSchema>;

// ============================================================================
// SIDAK PENCAHAYAAN (Lighting Inspection)
// ============================================================================

export const sidakPencahayaanSessions = pgTable("sidak_pencahayaan_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tanggal: varchar("tanggal").notNull(),
  shift: varchar("shift").notNull(),
  waktu: varchar("waktu").notNull(),
  lokasi: text("lokasi").notNull(),
  departemen: text("departemen"),
  penanggungJawab: varchar("penanggung_jawab"),
  totalSampel: integer("total_sampel").notNull().default(0),
  activityPhotos: text("activity_photos").array(),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_pencahayaan_sessions_created_by").on(table.createdBy)]);

export const sidakPencahayaanRecords = pgTable("sidak_pencahayaan_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sidakPencahayaanSessions.id, { onDelete: "cascade" }),
  ordinal: integer("ordinal").notNull(),
  titikPengambilan: text("titik_pengambilan"),
  sumberPenerangan: text("sumber_penerangan"),
  jenisPengukuran: varchar("jenis_pengukuran"),
  intensitasLux: integer("intensitas_lux"),
  jarakDariSumber: varchar("jarak_dari_sumber"),
  secaraVisual: varchar("secara_visual"),
  keterangan: text("keterangan"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_pencahayaan_records_session").on(table.sessionId)]);

export const sidakPencahayaanObservers = pgTable("sidak_pencahayaan_observers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => sidakPencahayaanSessions.id, { onDelete: "cascade" }),
  ordinal: integer("ordinal").notNull(),
  nama: text("nama").notNull(),
  perusahaan: text("perusahaan"),
  tandaTangan: text("tanda_tangan"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_pencahayaan_observers_session").on(table.sessionId)]);

export const insertSidakPencahayaanSessionSchema = createInsertSchema(sidakPencahayaanSessions).omit({ id: true, createdAt: true, totalSampel: true });
export const insertSidakPencahayaanRecordSchema =createInsertSchema(sidakPencahayaanRecords).omit({ id: true, createdAt: true });
export const insertSidakPencahayaanObserverSchema = createInsertSchema(sidakPencahayaanObservers).omit({ id: true, createdAt: true });

export type SidakPencahayaanSession = typeof sidakPencahayaanSessions.$inferSelect;
export type InsertSidakPencahayaanSession = z.infer<typeof insertSidakPencahayaanSessionSchema>;
export type SidakPencahayaanRecord = typeof sidakPencahayaanRecords.$inferSelect;
export type InsertSidakPencahayaanRecord = z.infer<typeof insertSidakPencahayaanRecordSchema>;
export type SidakPencahayaanObserver = typeof sidakPencahayaanObservers.$inferSelect;
export type InsertSidakPencahayaanObserver = z.infer<typeof insertSidakPencahayaanObserverSchema>;

// (Continue with LOTO, Digital, Workshop schemas in next message due to length...)
```

---

## Step 2: Storage Methods Template (storage.ts)

### Pattern to follow (using Jarak as example):

```typescript
// Add after existing SIDAK methods, before class closing brace

// ============================================================================
// SIDAK JARAK AMAN METHODS
// ============================================================================

async getSidakJarakSession(id: string): Promise<SidakJarakSession | undefined> {
  const [result] = await this.db
    .select()
    .from(sidakJarakSessions)
    .where(eq(sidakJarakSessions.id, id));
  return result;
}

async getAllSidakJarakSessions(): Promise<SidakJarakSession[]> {
  return await this.db
    .select()
    .from(sidakJarakSessions)
    .orderBy(desc(sidakJarakSessions.createdAt));
}

async createSidakJarakSession(session: InsertSidakJarakSession): Promise<SidakJarakSession> {
  const [result] = await this.db
    .insert(sidakJarakSessions)
    .values(session)
    .returning();
  return result;
}

async updateSidakJarakSession(id: string, updates: Partial<InsertSidakJarakSession>): Promise<SidakJarakSession | undefined> {
  const [result] = await this.db
    .update(sidakJarakSessions)
    .set(updates)
    .where(eq(sidakJarakSessions.id, id))
    .returning();
  return result;
}

async getSidakJarakRecords(sessionId: string): Promise<SidakJarakRecord[]> {
  return await this.db
    .select()
    .from(sidakJarakRecords)
    .where(eq(sidakJarakRecords.sessionId, sessionId))
    .orderBy(sidakJarakRecords.ordinal);
}

async createSidakJarakRecord(record: InsertSidakJarakRecord): Promise<SidakJarakRecord> {
  const [result] = await this.db
    .insert(sidakJarakRecords)
    .values(record)
    .returning();
  
  // Update session total sampel
  await this.updateSidakJarakSessionSampleCount(record.sessionId);
  
  return result;
}

async getSidakJarakObservers(sessionId: string): Promise<SidakJarakObserver[]> {
  return await this.db
    .select()
    .from(sidakJarakObservers)
    .where(eq(sidakJarakObservers.sessionId, sessionId))
    .orderBy(sidakJarakObservers.ordinal);
}

async createSidakJarakObserver(observer: InsertSidakJarakObserver): Promise<SidakJarakObserver> {
  const existingObservers = await this.getSidakJarakObservers(observer.sessionId);
  const nextOrdinal = existingObservers.length + 1;

  const [result] = await this.db
    .insert(sidakJarakObservers)
    .values({ ...observer, ordinal: nextOrdinal })
    .returning();
  return result;
}

async updateSidakJarakSessionSampleCount(sessionId: string): Promise<void> {
  const records = await this.getSidakJarakRecords(sessionId);
  await this.updateSidakJarakSession(sessionId, { totalSampel: records.length });
}
```

**Repeat this pattern for all 7 forms!** Just replace "Jarak" with form name.

---

## Step 3: API Routes Template (routes.ts)

Add routes after existing SIDAK routes:

```typescript
// SIDAK JARAK AMAN ROUTES
app.post("/api/sidak-jarak", async (req, res) => {
  try {
    const session = insertSidakJarakSessionSchema.parse(req.body);
    const result = await storage.createSidakJarakSession(session);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.get("/api/sidak-jarak/sessions", async (req, res) => {
  const sessions = await storage.getAllSidakJarakSessions();
  res.json(sessions);
});

app.get("/api/sidak-jarak/:id", async (req, res) => {
  const session = await storage.getSidakJarakSession(req.params.id);
  if (!session) return res.status(404).json({ message: "Session not found" });
  
  const records = await storage.getSidakJarakRecords(req.params.id);
  const observers = await storage.getSidakJarakObservers(req.params.id);
  
  res.json({ session, records, observers });
});

app.post("/api/sidak-jarak/:id/records", async (req, res) => {
  try {
    const record = insertSidakJarakRecordSchema.parse({
      ...req.body,
      sessionId: req.params.id
    });
    const result = await storage.createSidakJarakRecord(record);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

app.post("/api/sidak-jarak/:id/observers", async (req, res) => {
  try {
    const observer = insertSidakJarakObserverSchema.parse({
      ...req.body,
      sessionId: req.params.id
    });
    const result = await storage.createSidakJarakObserver(observer);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Add PDF and JPG routes following pattern from sidak-rambu
```

**Instructions for completion:**
1. Copy this template
2. Replace "Jarak" with each form name (Kecepatan, Pencahayaan, LOTO, Digital, Antrian, Workshop)
3. Adjust field names based on each form's schema
4. Test each endpoint

---

## TOTAL FILES TO CREATE/MODIFY:

### Files to MODIFY:
1. `shared/schema.ts` - Add all 7 schemas
2. `server/storage.ts` - Add methods for all 7 forms
3. `server/routes.ts` - Add routes for all 7 forms

### Files to CREATE (14 new files):
1. `client/src/pages/sidak-antrian-form.tsx`
2. `client/src/pages/sidak-antrian-history.tsx`
3. `client/src/pages/sidak-jarak-form.tsx`
4. `client/src/pages/sidak-jarak-history.tsx`
5. `client/src/pages/sidak-kecepatan-form.tsx`
6. `client/src/pages/sidak-kecepatan-history.tsx`
7. `client/src/pages/sidak-pencahayaan-form.tsx`
8. `client/src/pages/sidak-pencahayaan-history.tsx`
9. `client/src/pages/sidak-loto-form.tsx`
10. `client/src/pages/sidak-loto-history.tsx`
11. `client/src/pages/sidak-digital-form.tsx`
12. `client/src/pages/sidak-digital-history.tsx`
13. `client/src/pages/sidak-workshop-form.tsx`
14. `client/src/pages/sidak-workshop-history.tsx`

### PDF Utils (7 new files):
15-21. `client/src/lib/sidak-[formname]-pdf-utils.ts`

---

**Next:** I'll provide the remaining schemas (LOTO, Digital, Workshop) and frontend component templates in separate files...
