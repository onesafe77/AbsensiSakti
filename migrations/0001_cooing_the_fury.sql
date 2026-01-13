CREATE TABLE "change_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"request_type" text DEFAULT 'REVISION' NOT NULL,
	"priority" text DEFAULT 'NORMAL' NOT NULL,
	"reason" text NOT NULL,
	"description" text,
	"proposed_changes" text,
	"affected_sections" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_by_name" text,
	"reviewed_at" timestamp,
	"review_comments" text,
	"completed_at" timestamp,
	"new_version_id" varchar,
	"requested_by" varchar NOT NULL,
	"requested_by_name" text NOT NULL,
	"requested_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competency_monitoring_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tna_entry_id" varchar NOT NULL,
	"log_date" text NOT NULL,
	"status" text NOT NULL,
	"expiry_days_remaining" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_approval_steps" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"approval_id" varchar NOT NULL,
	"step_number" integer NOT NULL,
	"step_name" text,
	"mode" text DEFAULT 'SERIAL' NOT NULL,
	"quorum_required" integer DEFAULT 1 NOT NULL,
	"quorum_achieved" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "document_approvals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version_id" varchar NOT NULL,
	"workflow_name" text,
	"total_steps" integer DEFAULT 1 NOT NULL,
	"current_step" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"initiated_by" varchar NOT NULL,
	"initiated_by_name" text NOT NULL,
	"initiated_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"final_decision" text,
	"final_notes" text
);
--> statement-breakpoint
CREATE TABLE "document_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"action" text NOT NULL,
	"details" jsonb,
	"performed_by" varchar NOT NULL,
	"performed_by_name" text NOT NULL,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_disposal_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"document_code" text,
	"document_title" text,
	"disposed_by" varchar,
	"disposed_by_name" text,
	"disposed_at" timestamp DEFAULT now(),
	"method" text DEFAULT 'ELECTRONIC_DELETION' NOT NULL,
	"reason" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "document_distributions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version_id" varchar NOT NULL,
	"recipient_id" varchar NOT NULL,
	"recipient_name" text NOT NULL,
	"recipient_department" text,
	"is_mandatory" boolean DEFAULT true NOT NULL,
	"deadline" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"acknowledged_at" timestamp,
	"ip_address" text,
	"user_agent" text,
	"distributed_by" varchar NOT NULL,
	"distributed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_export_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version_id" varchar NOT NULL,
	"action" text NOT NULL,
	"exported_by" varchar NOT NULL,
	"exported_by_name" text NOT NULL,
	"watermark_text" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_masterlist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_code" varchar NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"department" text NOT NULL,
	"current_version" integer DEFAULT 1 NOT NULL,
	"current_revision" integer DEFAULT 0 NOT NULL,
	"owner_id" varchar NOT NULL,
	"owner_name" text NOT NULL,
	"lifecycle_status" text DEFAULT 'DRAFT' NOT NULL,
	"control_type" text DEFAULT 'CONTROLLED' NOT NULL,
	"effective_date" text,
	"next_review_date" text,
	"expiry_date" text,
	"sign_required" boolean DEFAULT true NOT NULL,
	"description" text,
	"keywords" text[],
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "document_masterlist_document_code_unique" UNIQUE("document_code")
);
--> statement-breakpoint
CREATE TABLE "document_step_assignees" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_id" varchar NOT NULL,
	"assignee_id" varchar NOT NULL,
	"assignee_name" text NOT NULL,
	"assignee_position" text,
	"decision" text,
	"comments" text,
	"decided_at" timestamp,
	"notified_at" timestamp,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version_number" integer NOT NULL,
	"revision_number" integer DEFAULT 0 NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"mime_type" text DEFAULT 'application/pdf',
	"signed_file_path" text,
	"signed_at" timestamp,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"changes_note" text,
	"uploaded_by" varchar NOT NULL,
	"uploaded_by_name" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "esign_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"version_id" varchar NOT NULL,
	"approval_id" varchar,
	"provider" text DEFAULT 'uSign' NOT NULL,
	"external_request_id" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"signer_id" varchar NOT NULL,
	"signer_name" text NOT NULL,
	"signer_position" text,
	"requested_at" timestamp DEFAULT now(),
	"signed_at" timestamp,
	"signed_file_path" text,
	"failed_reason" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"last_retry_at" timestamp,
	"created_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_code" varchar NOT NULL,
	"title" text NOT NULL,
	"source" text NOT NULL,
	"issued_by" text,
	"version_number" text,
	"issue_date" text,
	"next_review_date" text,
	"file_type" text DEFAULT 'LINK' NOT NULL,
	"file_url" text,
	"file_name" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"distribution_required" boolean DEFAULT false NOT NULL,
	"owner_id" varchar,
	"owner_name" text,
	"department" text,
	"notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "kompetensi_sertifikat_monitoring" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar,
	"employee_name" text,
	"department" text,
	"position" text,
	"nama_kompetensi" text NOT NULL,
	"kategori" text NOT NULL,
	"no_sertifikat" text,
	"lembaga" text,
	"tgl_terbit" text NOT NULL,
	"masa_berlaku_tahun" integer NOT NULL,
	"tgl_expired" text NOT NULL,
	"monitoring_harian_status" text DEFAULT 'Aktif',
	"no_surat_penunjukan" text,
	"bukti_penunjukan_pdf" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"created_by" varchar
);
--> statement-breakpoint
CREATE TABLE "si_asef_chat_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"sources" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "si_asef_chat_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"user_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "si_asef_chunks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar NOT NULL,
	"chunk_index" integer NOT NULL,
	"content" text NOT NULL,
	"page_number" integer DEFAULT 1,
	"start_position" integer DEFAULT 0,
	"end_position" integer DEFAULT 0,
	"embedding" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "si_asef_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" text,
	"folder" text DEFAULT 'Umum',
	"total_pages" integer DEFAULT 1,
	"total_chunks" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"uploaded_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_antrian_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"perusahaan" text,
	"jabatan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_antrian_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama_nik" text NOT NULL,
	"no_lambung" varchar,
	"handbrake_aktif" boolean NOT NULL,
	"jarak_unit_aman" boolean NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_antrian_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"perusahaan" text NOT NULL,
	"departemen" text NOT NULL,
	"lokasi" text NOT NULL,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_apd_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"perusahaan" text,
	"jabatan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_apd_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" text,
	"jabatan" text,
	"perusahaan" text,
	"area_kerja" text,
	"helm" boolean DEFAULT false NOT NULL,
	"rompi" boolean DEFAULT false NOT NULL,
	"sepatu" boolean DEFAULT false NOT NULL,
	"kacamata" boolean DEFAULT false NOT NULL,
	"sarung_tangan" boolean DEFAULT false NOT NULL,
	"earplug" boolean DEFAULT false NOT NULL,
	"masker" boolean DEFAULT false NOT NULL,
	"apd_lengkap" boolean DEFAULT false NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_apd_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"perusahaan" text NOT NULL,
	"departemen" text NOT NULL,
	"lokasi" text NOT NULL,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_digital_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" varchar,
	"perusahaan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_digital_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama_pengawas" text NOT NULL,
	"nik" varchar,
	"jabatan" text,
	"app_usage" boolean DEFAULT true NOT NULL,
	"timely_reporting" boolean DEFAULT true NOT NULL,
	"feedback_quality" text,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_digital_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"lokasi" text NOT NULL,
	"departemen" text,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_jarak_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"perusahaan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_jarak_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"no_kendaraan" varchar NOT NULL,
	"tipe_unit" varchar NOT NULL,
	"lokasi_muatan" text,
	"lokasi_kosongan" text,
	"nomor_lambung_unit" varchar,
	"jarak_aktual_kedua" text,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_jarak_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"lokasi" text NOT NULL,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"persen_kepatuhan" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_kecepatan_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" text,
	"perusahaan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_kecepatan_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"no_kendaraan" varchar NOT NULL,
	"tipe_unit" varchar NOT NULL,
	"arah_muatan" boolean DEFAULT false,
	"arah_kosongan" boolean DEFAULT false,
	"kecepatan_mph" text,
	"kecepatan_kph" text,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_kecepatan_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"lokasi" text NOT NULL,
	"sub_lokasi" text,
	"batas_kecepatan_kph" integer DEFAULT 0,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_loto_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" varchar,
	"perusahaan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_loto_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama_karyawan" text NOT NULL,
	"perusahaan" text,
	"jenis_pekerjaan" text,
	"lokasi_isolasi" text,
	"nomor_gembok" varchar,
	"jam_pasang" varchar,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_loto_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"lokasi" text NOT NULL,
	"departemen" text,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_pencahayaan_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" varchar,
	"perusahaan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_pencahayaan_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"titik_pengambilan" text NOT NULL,
	"sumber_penerangan" text,
	"jenis_pengukuran" varchar,
	"intensitas_lux" integer,
	"jarak_dari_sumber" varchar,
	"secara_visual" varchar,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_pencahayaan_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"lokasi" text NOT NULL,
	"departemen" text,
	"penanggung_jawab" varchar,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_workshop_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" varchar,
	"perusahaan" text,
	"tanda_tangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_workshop_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama_alat" text NOT NULL,
	"kondisi" boolean DEFAULT true NOT NULL,
	"kebersihan" boolean DEFAULT true NOT NULL,
	"sertifikasi" boolean DEFAULT true NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_workshop_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"waktu" varchar NOT NULL,
	"lokasi" text NOT NULL,
	"departemen" text,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tna_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tna_summary_id" varchar NOT NULL,
	"training_id" varchar NOT NULL,
	"plan_status" text NOT NULL,
	"actual_status" text,
	"actual_date" text,
	"trainer_provider" text,
	"evidence_file" text,
	"notes" text,
	"certificate_number" text,
	"issuer" text,
	"issue_date" text,
	"expiry_date" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tna_summaries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"period" text NOT NULL,
	"status" text DEFAULT 'Draft' NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"is_mandatory" boolean DEFAULT false NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "trainings_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "sidak_fatigue_sessions" ADD COLUMN "waktu" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sidak_rambu_sessions" ADD COLUMN "created_by" varchar;--> statement-breakpoint
ALTER TABLE "sidak_roster_sessions" ADD COLUMN "tanggal" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sidak_roster_sessions" ADD COLUMN "waktu" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sidak_seatbelt_sessions" ADD COLUMN "tanggal" text NOT NULL;--> statement-breakpoint
ALTER TABLE "sidak_seatbelt_sessions" ADD COLUMN "waktu" text NOT NULL;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_document_id_document_masterlist_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_masterlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_reviewed_by_employees_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_new_version_id_document_versions_id_fk" FOREIGN KEY ("new_version_id") REFERENCES "public"."document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_requests" ADD CONSTRAINT "change_requests_requested_by_employees_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competency_monitoring_logs" ADD CONSTRAINT "competency_monitoring_logs_tna_entry_id_tna_entries_id_fk" FOREIGN KEY ("tna_entry_id") REFERENCES "public"."tna_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_approval_steps" ADD CONSTRAINT "document_approval_steps_approval_id_document_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."document_approvals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_document_id_document_masterlist_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_masterlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_version_id_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_audit_logs" ADD CONSTRAINT "document_audit_logs_document_id_document_masterlist_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_masterlist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_disposal_records" ADD CONSTRAINT "document_disposal_records_disposed_by_employees_id_fk" FOREIGN KEY ("disposed_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_distributions" ADD CONSTRAINT "document_distributions_document_id_document_masterlist_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_masterlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_distributions" ADD CONSTRAINT "document_distributions_version_id_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_distributions" ADD CONSTRAINT "document_distributions_recipient_id_employees_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_export_logs" ADD CONSTRAINT "document_export_logs_document_id_document_masterlist_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_masterlist"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_export_logs" ADD CONSTRAINT "document_export_logs_version_id_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_export_logs" ADD CONSTRAINT "document_export_logs_exported_by_employees_id_fk" FOREIGN KEY ("exported_by") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_masterlist" ADD CONSTRAINT "document_masterlist_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_step_assignees" ADD CONSTRAINT "document_step_assignees_step_id_document_approval_steps_id_fk" FOREIGN KEY ("step_id") REFERENCES "public"."document_approval_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_step_assignees" ADD CONSTRAINT "document_step_assignees_assignee_id_employees_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_document_masterlist_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_masterlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esign_requests" ADD CONSTRAINT "esign_requests_document_id_document_masterlist_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_masterlist"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esign_requests" ADD CONSTRAINT "esign_requests_version_id_document_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."document_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esign_requests" ADD CONSTRAINT "esign_requests_approval_id_document_approvals_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."document_approvals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esign_requests" ADD CONSTRAINT "esign_requests_signer_id_employees_id_fk" FOREIGN KEY ("signer_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_documents" ADD CONSTRAINT "external_documents_owner_id_employees_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kompetensi_sertifikat_monitoring" ADD CONSTRAINT "kompetensi_sertifikat_monitoring_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si_asef_chat_messages" ADD CONSTRAINT "si_asef_chat_messages_session_id_si_asef_chat_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."si_asef_chat_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "si_asef_chunks" ADD CONSTRAINT "si_asef_chunks_document_id_si_asef_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."si_asef_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_antrian_observers" ADD CONSTRAINT "sidak_antrian_observers_session_id_sidak_antrian_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_antrian_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_antrian_records" ADD CONSTRAINT "sidak_antrian_records_session_id_sidak_antrian_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_antrian_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_apd_observers" ADD CONSTRAINT "sidak_apd_observers_session_id_sidak_apd_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_apd_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_apd_records" ADD CONSTRAINT "sidak_apd_records_session_id_sidak_apd_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_apd_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_digital_observers" ADD CONSTRAINT "sidak_digital_observers_session_id_sidak_digital_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_digital_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_digital_records" ADD CONSTRAINT "sidak_digital_records_session_id_sidak_digital_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_digital_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_jarak_observers" ADD CONSTRAINT "sidak_jarak_observers_session_id_sidak_jarak_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_jarak_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_jarak_records" ADD CONSTRAINT "sidak_jarak_records_session_id_sidak_jarak_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_jarak_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_kecepatan_observers" ADD CONSTRAINT "sidak_kecepatan_observers_session_id_sidak_kecepatan_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_kecepatan_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_kecepatan_records" ADD CONSTRAINT "sidak_kecepatan_records_session_id_sidak_kecepatan_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_kecepatan_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_loto_observers" ADD CONSTRAINT "sidak_loto_observers_session_id_sidak_loto_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_loto_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_loto_records" ADD CONSTRAINT "sidak_loto_records_session_id_sidak_loto_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_loto_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_pencahayaan_observers" ADD CONSTRAINT "sidak_pencahayaan_observers_session_id_sidak_pencahayaan_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_pencahayaan_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_pencahayaan_records" ADD CONSTRAINT "sidak_pencahayaan_records_session_id_sidak_pencahayaan_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_pencahayaan_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_workshop_observers" ADD CONSTRAINT "sidak_workshop_observers_session_id_sidak_workshop_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_workshop_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_workshop_records" ADD CONSTRAINT "sidak_workshop_records_session_id_sidak_workshop_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_workshop_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tna_entries" ADD CONSTRAINT "tna_entries_tna_summary_id_tna_summaries_id_fk" FOREIGN KEY ("tna_summary_id") REFERENCES "public"."tna_summaries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tna_entries" ADD CONSTRAINT "tna_entries_training_id_trainings_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tna_summaries" ADD CONSTRAINT "tna_summaries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_change_requests_document" ON "change_requests" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_change_requests_status" ON "change_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_change_requests_requested_by" ON "change_requests" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "IDX_comp_mon_log_date" ON "competency_monitoring_logs" USING btree ("log_date");--> statement-breakpoint
CREATE INDEX "IDX_comp_mon_log_status" ON "competency_monitoring_logs" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "comp_mon_log_entry_date" ON "competency_monitoring_logs" USING btree ("tna_entry_id","log_date");--> statement-breakpoint
CREATE INDEX "IDX_doc_approval_steps_approval" ON "document_approval_steps" USING btree ("approval_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_approvals_document" ON "document_approvals" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_approvals_status" ON "document_approvals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_doc_audit_logs_document" ON "document_audit_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_audit_logs_created_at" ON "document_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_doc_distributions_document" ON "document_distributions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_distributions_recipient" ON "document_distributions" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_distributions_is_read" ON "document_distributions" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "IDX_doc_export_logs_document" ON "document_export_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_export_logs_exported_by" ON "document_export_logs" USING btree ("exported_by");--> statement-breakpoint
CREATE INDEX "IDX_doc_masterlist_code" ON "document_masterlist" USING btree ("document_code");--> statement-breakpoint
CREATE INDEX "IDX_doc_masterlist_category" ON "document_masterlist" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_doc_masterlist_department" ON "document_masterlist" USING btree ("department");--> statement-breakpoint
CREATE INDEX "IDX_doc_masterlist_status" ON "document_masterlist" USING btree ("lifecycle_status");--> statement-breakpoint
CREATE INDEX "IDX_doc_masterlist_owner" ON "document_masterlist" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_step_assignees_step" ON "document_step_assignees" USING btree ("step_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_step_assignees_assignee" ON "document_step_assignees" USING btree ("assignee_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_versions_document" ON "document_versions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_doc_versions_status" ON "document_versions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_esign_requests_document" ON "esign_requests" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_esign_requests_status" ON "esign_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_esign_requests_signer" ON "esign_requests" USING btree ("signer_id");--> statement-breakpoint
CREATE INDEX "IDX_external_docs_code" ON "external_documents" USING btree ("document_code");--> statement-breakpoint
CREATE INDEX "IDX_external_docs_source" ON "external_documents" USING btree ("source");--> statement-breakpoint
CREATE INDEX "IDX_external_docs_status" ON "external_documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_kompetensi_expiry" ON "kompetensi_sertifikat_monitoring" USING btree ("tgl_expired");--> statement-breakpoint
CREATE INDEX "IDX_kompetensi_employee" ON "kompetensi_sertifikat_monitoring" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "IDX_asef_messages_session" ON "si_asef_chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_asef_messages_created" ON "si_asef_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_asef_chunks_doc" ON "si_asef_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "IDX_asef_docs_folder" ON "si_asef_documents" USING btree ("folder");--> statement-breakpoint
CREATE INDEX "IDX_antrian_observers_session" ON "sidak_antrian_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_antrian_records_session" ON "sidak_antrian_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_antrian_sessions_created_by" ON "sidak_antrian_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_apd_observers_session" ON "sidak_apd_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_apd_records_session" ON "sidak_apd_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_apd_sessions_created_by" ON "sidak_apd_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_digital_observers_session" ON "sidak_digital_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_digital_records_session" ON "sidak_digital_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_digital_sessions_created_by" ON "sidak_digital_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_jarak_observers_session" ON "sidak_jarak_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_jarak_records_session" ON "sidak_jarak_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_jarak_sessions_created_by" ON "sidak_jarak_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_kecepatan_observers_session" ON "sidak_kecepatan_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_kecepatan_records_session" ON "sidak_kecepatan_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_kecepatan_sessions_created_by" ON "sidak_kecepatan_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_loto_observers_session" ON "sidak_loto_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_loto_records_session" ON "sidak_loto_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_loto_sessions_created_by" ON "sidak_loto_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_pencahayaan_observers_session" ON "sidak_pencahayaan_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_pencahayaan_records_session" ON "sidak_pencahayaan_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_pencahayaan_sessions_created_by" ON "sidak_pencahayaan_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_workshop_observers_session" ON "sidak_workshop_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_workshop_records_session" ON "sidak_workshop_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_workshop_sessions_created_by" ON "sidak_workshop_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_tna_entries_summary" ON "tna_entries" USING btree ("tna_summary_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tna_entry_summary_training" ON "tna_entries" USING btree ("tna_summary_id","training_id");--> statement-breakpoint
CREATE INDEX "IDX_tna_entries_expiry" ON "tna_entries" USING btree ("expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "tna_summary_employee_period" ON "tna_summaries" USING btree ("employee_id","period");--> statement-breakpoint
CREATE INDEX "IDX_tna_summary_period" ON "tna_summaries" USING btree ("period");--> statement-breakpoint
CREATE INDEX "IDX_trainings_name" ON "trainings" USING btree ("name");--> statement-breakpoint
CREATE INDEX "IDX_trainings_category" ON "trainings" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_rambu_sessions_created_by" ON "sidak_rambu_sessions" USING btree ("created_by");--> statement-breakpoint
ALTER TABLE "sidak_roster_sessions" DROP COLUMN "tanggal_pelaksanaan";--> statement-breakpoint
ALTER TABLE "sidak_roster_sessions" DROP COLUMN "jam_pelaksanaan";--> statement-breakpoint
ALTER TABLE "sidak_seatbelt_sessions" DROP COLUMN "tanggal_pelaksanaan";--> statement-breakpoint
ALTER TABLE "sidak_seatbelt_sessions" DROP COLUMN "jam_pelaksanaan";