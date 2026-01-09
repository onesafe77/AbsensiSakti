// ============================================================================
// SIDAK LOTO (Lock Out Tag Out Inspection)
// ============================================================================

export const sidakLotoSessions = pgTable("sidak_loto_sessions", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tanggal: varchar("tanggal").notNull(),
    shift: varchar("shift").notNull(),
    waktu: varchar("waktu").notNull(),
    lokasi: text("lokasi").notNull(),
    jumlahSampel: integer("jumlah_sampel").notNull().default(0),
    activityPhotos: text("activity_photos").array(),
    createdBy: varchar("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_loto_sessions_created_by").on(table.createdBy)]);

export const sidakLotoRecords = pgTable("sidak_loto_records", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().references(() => sidakLotoSessions.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    nama: text("nama").notNull(),
    nik: varchar("nik"),
    perusahaan: text("perusahaan"),
    // 5 LOTO checklist items
    gembokTagTerpasang: boolean("gembok_tag_terpasang").notNull(),
    dangerTagSesuai: boolean("danger_tag_sesuai").notNull(),
    gembokSesuai: boolean("gembok_sesuai").notNull(),
    setiapPeralihKurung: boolean("setiap_peralih_kurung").notNull(),
    multiLockBenar: boolean("multi_lock_benar").notNull(),
    keterangan: text("keterangan"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_loto_records_session").on(table.sessionId)]);

export const sidakLotoObservers = pgTable("sidak_loto_observers", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().references(() => sidakLotoSessions.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    nama: text("nama").notNull(),
    perusahaan: text("perusahaan"),
    tandaTangan: text("tanda_tangan"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_loto_observers_session").on(table.sessionId)]);

export const insertSidakLotoSessionSchema = createInsertSchema(sidakLotoSessions).omit({ id: true, createdAt: true, jumlahSampel: true });
export const insertSidakLotoRecordSchema = createInsertSchema(sidakLotoRecords).omit({ id: true, createdAt: true });
export const insertSidakLotoObserverSchema = createInsertSchema(sidakLotoObservers).omit({ id: true, createdAt: true });

export type SidakLotoSession = typeof sidakLotoSessions.$inferSelect;
export type InsertSidakLotoSession = z.infer<typeof insertSidakLotoSessionSchema>;
export type SidakLotoRecord = typeof sidakLotoRecords.$inferSelect;
export type InsertSidakLotoRecord = z.infer<typeof insertSidakLotoRecordSchema>;
export type SidakLotoObserver = typeof sidakLotoObservers.$inferSelect;
export type InsertSidakLotoObserver = z.infer<typeof insertSidakLotoObserverSchema>;

// ============================================================================
// SIDAK DIGITAL (Digital Supervisor Inspection)
// ============================================================================

export const sidakDigitalSessions = pgTable("sidak_digital_sessions", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tanggal: varchar("tanggal").notNull(),
    shift: varchar("shift").notNull(),
    waktu: varchar("waktu").notNull(),
    lokasi: text("lokasi").notNull(),
    jumlahSampel: integer("jumlah_sampel").notNull().default(0),
    activityPhotos: text("activity_photos").array(),
    createdBy: varchar("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_digital_sessions_created_by").on(table.createdBy)]);

export const sidakDigitalRecords = pgTable("sidak_digital_records", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().references(() => sidakDigitalSessions.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    nama: text("nama").notNull(),
    nik: varchar("nik"),
    perusahaan: text("perusahaan"),
    // 7 digital supervisor checklist items (all boolean)
    pengawasBeradaDiDepan: boolean("pengawas_berada_di_depan").notNull(),
    pengawasTidakMenggunakanSap: boolean("pengawas_tidak_menggunakan_sap").notNull(),
    pengawasTidakMengarahkanSap1: boolean("pengawas_tidak_mengarahkan_sap_1").notNull(),
    pengawasTidakMengarahkanSap2: boolean("pengawas_tidak_mengarahkan_sap_2").notNull(),
    pengawasTidakMengarahkanPpe: boolean("pengawas_tidak_mengarahkan_ppe").notNull(),
    pengawasTidakMenggunakanPpeRemote: boolean("pengawas_tidak_menggunakan_ppe_remote").notNull(),
    pengawasMampuMengidentifikasi: boolean("pengawas_mampu_mengidentifikasi").notNull(),
    keterangan: text("keterangan"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_digital_records_session").on(table.sessionId)]);

export const sidakDigitalObservers = pgTable("sidak_digital_observers", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().references(() => sidakDigitalSessions.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    nama: text("nama").notNull(),
    perusahaan: text("perusahaan"),
    tandaTangan: text("tanda_tangan"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_digital_observers_session").on(table.sessionId)]);

export const insertSidakDigitalSessionSchema = createInsertSchema(sidakDigitalSessions).omit({ id: true, createdAt: true, jumlahSampel: true });
export const insertSidakDigitalRecordSchema = createInsertSchema(sidakDigitalRecords).omit({ id: true, createdAt: true });
export const insertSidakDigitalObserverSchema = createInsertSchema(sidakDigitalObservers).omit({ id: true, createdAt: true });

export type SidakDigitalSession = typeof sidakDigitalSessions.$inferSelect;
export type InsertSidakDigitalSession = z.infer<typeof insertSidakDigitalSessionSchema>;
export type SidakDigitalRecord = typeof sidakDigitalRecords.$inferSelect;
export type InsertSidakDigitalRecord = z.infer<typeof insertSidakDigitalRecordSchema>;
export type SidakDigitalObserver = typeof sidakDigitalObservers.$inferSelect;
export type InsertSidakDigitalObserver = z.infer<typeof insertSidakDigitalObserverSchema>;

// ============================================================================
// SIDAK WORKSHOP (Workshop Equipment Inspection)
// ============================================================================
// Note: This is the most complex form with 10 equipment categories

export const sidakWorkshopSessions = pgTable("sidak_workshop_sessions", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tanggal: varchar("tanggal").notNull(),
    lokasi: text("lokasi").notNull(),
    namaWorkshop: text("nama_workshop").notNull(),
    penanggungJawabArea: varchar("penanggung_jawab_area"),
    activityPhotos: text("activity_photos").array(),
    createdBy: varchar("created_by"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_workshop_sessions_created_by").on(table.createdBy)]);

// Workshop uses single records table with category field
export const sidakWorkshopRecords = pgTable("sidak_workshop_records", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().references(() => sidakWorkshopSessions.id, { onDelete: "cascade" }),
    category: varchar("category").notNull(), // APAR, COMPRESSOR, IMPACT, etc (10 types)
    itemNumber: varchar("item_number").notNull(), // e.g., "1.1", "2.5", "3.1.2"
    noRegister: varchar("no_register"),
    deskripsi: text("deskripsi").notNull(),
    kesesuaian: varchar("kesesuaian").notNull(), // "S" (Sesuai) or "TS" (Tidak Sesuai)
    tindakLanjut: text("tindak_lanjut"),
    dueDate: varchar("due_date"), // Date string
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
    index("IDX_workshop_records_session").on(table.sessionId),
    index("IDX_workshop_records_category").on(table.category),
]);

export const sidakWorkshopInspectors = pgTable("sidak_workshop_inspectors", {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id").notNull().references(() => sidakWorkshopSessions.id, { onDelete: "cascade" }),
    ordinal: integer("ordinal").notNull(),
    nama: text("nama").notNull(),
    perusahaan: text("perusahaan"),
    tandaTangan: text("tanda_tangan"),
    createdAt: timestamp("created_at").defaultNow(),
}, (table) => [index("IDX_workshop_inspectors_session").on(table.sessionId)]);

export const insertSidakWorkshopSessionSchema = createInsertSchema(sidakWorkshopSessions).omit({ id: true, createdAt: true });
export const insertSidakWorkshopRecordSchema = createInsertSchema(sidakWorkshopRecords).omit({ id: true, createdAt: true });
export const insertSidakWorkshopInspectorSchema = createInsertSchema(sidakWorkshopInspectors).omit({ id: true, createdAt: true });

export type SidakWorkshopSession = typeof sidakWorkshopSessions.$inferSelect;
export type InsertSidakWorkshopSession = z.infer<typeof insertSidakWorkshopSessionSchema>;
export type SidakWorkshopRecord = typeof sidakWorkshopRecords.$inferSelect;
export type InsertSidakWorkshopRecord = z.infer<typeof insertSidakWorkshopRecordSchema>;
export type SidakWorkshopInspector = typeof sidakWorkshopInspectors.$inferSelect;
export type InsertSidakWorkshopInspector = z.infer<typeof insertSidakWorkshopInspectorSchema>;

// ============================================================================
// END OF SCHEMA ADDITIONS
// ============================================================================

// INSTRUCTIONS:
// 1. Copy all schemas above
// 2. Paste at END of shared/schema.ts (before closing of file)
// 3. Ensure all imports are present at top of schema.ts:
//    - pgTable, varchar, text, integer, boolean, timestamp, index from "drizzle-orm/pg-core"
//    - sql, eq, desc from "drizzle-orm"
//    - createInsertSchema from "drizzle-zod"
//    - z from "zod"
// 4. Run database migrations to create tables
