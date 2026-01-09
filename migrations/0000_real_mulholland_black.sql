CREATE TABLE "announcement_reads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"employee_name" text NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"image_urls" text[],
	"created_by" varchar NOT NULL,
	"created_by_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"jam_tidur" text,
	"fit_to_work" text,
	"status" text DEFAULT 'present' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "auth_users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nik" varchar NOT NULL,
	"hashed_password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "auth_users_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"file_name" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"uploaded_by" varchar NOT NULL,
	"uploaded_by_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "employees" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" text,
	"nomor_lambung" text,
	"is_spare_origin" boolean DEFAULT false,
	"department" text,
	"investor_group" text,
	"phone" text NOT NULL,
	"qr_code" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_balances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"year" integer NOT NULL,
	"total_days" integer DEFAULT 0 NOT NULL,
	"used_days" integer DEFAULT 0 NOT NULL,
	"remaining_days" integer DEFAULT 0 NOT NULL,
	"working_days_completed" integer DEFAULT 0 NOT NULL,
	"last_work_date" text,
	"last_leave_date" text,
	"next_leave_eligible" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"leave_request_id" varchar,
	"leave_type" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"total_days" integer NOT NULL,
	"balance_before_leave" integer NOT NULL,
	"balance_after_leave" integer NOT NULL,
	"status" text NOT NULL,
	"remarks" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_reminders" (
	"id" varchar PRIMARY KEY NOT NULL,
	"leave_request_id" varchar NOT NULL,
	"employee_id" varchar NOT NULL,
	"reminder_type" text NOT NULL,
	"sent_at" timestamp NOT NULL,
	"phone_number" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"employee_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"leave_type" text NOT NULL,
	"reason" text,
	"attachment_path" text,
	"action_attachment_path" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leave_roster_monitoring" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nik" varchar NOT NULL,
	"name" text NOT NULL,
	"nomor_lambung" text,
	"month" varchar NOT NULL,
	"investor_group" text NOT NULL,
	"last_leave_date" text,
	"leave_option" text NOT NULL,
	"monitoring_days" integer DEFAULT 0 NOT NULL,
	"next_leave_date" text,
	"on_site" text,
	"status" text DEFAULT 'Aktif' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "leave_roster_monitoring_nik_month_unique" UNIQUE("nik","month")
);
--> statement-breakpoint
CREATE TABLE "meeting_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"meeting_id" varchar NOT NULL,
	"employee_id" varchar,
	"scan_time" varchar NOT NULL,
	"scan_date" varchar NOT NULL,
	"device_info" varchar,
	"attendance_type" varchar DEFAULT 'qr_scan' NOT NULL,
	"manual_name" varchar,
	"manual_position" varchar,
	"manual_department" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar NOT NULL,
	"description" text,
	"date" varchar NOT NULL,
	"start_time" varchar NOT NULL,
	"end_time" varchar NOT NULL,
	"location" varchar NOT NULL,
	"organizer" varchar NOT NULL,
	"status" varchar DEFAULT 'scheduled' NOT NULL,
	"qr_token" varchar,
	"meeting_photos" text[],
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "meetings_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"image_url" text,
	"image_urls" text[],
	"is_important" boolean DEFAULT false NOT NULL,
	"created_by" varchar NOT NULL,
	"created_by_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "qr_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "roster_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" varchar NOT NULL,
	"date" text NOT NULL,
	"shift" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"jam_tidur" text,
	"fit_to_work" text DEFAULT 'Fit To Work' NOT NULL,
	"hari_kerja" text,
	"planned_nomor_lambung" text,
	"actual_nomor_lambung" text,
	"status" text DEFAULT 'scheduled' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_patrol_attendance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" varchar NOT NULL,
	"unit_code" text NOT NULL,
	"shift" text NOT NULL,
	"status" text NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safety_patrol_raw_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" text,
	"sender_phone" text NOT NULL,
	"sender_name" text,
	"message_type" text NOT NULL,
	"content" text,
	"media_url" text,
	"raw_payload" jsonb,
	"message_timestamp" timestamp,
	"processed" boolean DEFAULT false NOT NULL,
	"report_id" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "safety_patrol_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" text NOT NULL,
	"bulan" text,
	"week" integer,
	"waktu_pelaksanaan" text,
	"jenis_laporan" text NOT NULL,
	"kegiatan" text,
	"shift" text,
	"lokasi" text,
	"pemateri" text[],
	"nama_pelaksana" text,
	"temuan" text,
	"bukti_kegiatan" text[],
	"raw_message" text NOT NULL,
	"parsed_data" jsonb,
	"photos" text[],
	"sender_phone" text NOT NULL,
	"sender_name" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"ai_analysis" text,
	"created_at" timestamp DEFAULT now(),
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "safety_patrol_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"example_message" text NOT NULL,
	"expected_fields" jsonb,
	"matching_keywords" text[],
	"prompt_context" text,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sidak_fatigue_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"nama" text NOT NULL,
	"nik" text NOT NULL,
	"perusahaan" text NOT NULL,
	"jabatan" text NOT NULL,
	"signature_data_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_fatigue_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"employee_id" varchar,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" text NOT NULL,
	"jabatan" text NOT NULL,
	"nomor_lambung" text,
	"jam_tidur" integer NOT NULL,
	"konsumsi_obat" boolean DEFAULT false NOT NULL,
	"masalah_pribadi" boolean DEFAULT false NOT NULL,
	"pemeriksaan_respon" boolean DEFAULT true NOT NULL,
	"pemeriksaan_konsentrasi" boolean DEFAULT true NOT NULL,
	"pemeriksaan_kesehatan" boolean DEFAULT true NOT NULL,
	"karyawan_siap_bekerja" boolean DEFAULT true NOT NULL,
	"fit_untuk_bekerja" boolean DEFAULT true NOT NULL,
	"istirahat_dan_monitor" boolean DEFAULT false NOT NULL,
	"istirahat_lebih_dari_satu_jam" boolean DEFAULT false NOT NULL,
	"tidak_boleh_bekerja" boolean DEFAULT false NOT NULL,
	"employee_signature" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_fatigue_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" text NOT NULL,
	"shift" text NOT NULL,
	"waktu_mulai" text NOT NULL,
	"waktu_selesai" text NOT NULL,
	"lokasi" text NOT NULL,
	"area" text NOT NULL,
	"departemen" text NOT NULL,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"created_by" varchar,
	"activity_photos" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_rambu_observations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"no_kendaraan" varchar NOT NULL,
	"perusahaan" text NOT NULL,
	"rambu_stop" boolean DEFAULT true NOT NULL,
	"rambu_give_way" boolean DEFAULT true NOT NULL,
	"rambu_kecepatan_max" boolean DEFAULT true NOT NULL,
	"rambu_larangan_masuk" boolean DEFAULT true NOT NULL,
	"rambu_larangan_parkir" boolean DEFAULT true NOT NULL,
	"rambu_wajib_helm" boolean DEFAULT true NOT NULL,
	"rambu_larangan_uturn" boolean DEFAULT true NOT NULL,
	"keterangan" text DEFAULT '',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_rambu_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"perusahaan" text NOT NULL,
	"signature_data_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_rambu_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal" varchar NOT NULL,
	"shift" varchar NOT NULL,
	"waktu_mulai" varchar NOT NULL,
	"waktu_selesai" varchar NOT NULL,
	"lokasi" text NOT NULL,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_roster_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"nama" text NOT NULL,
	"nik" text NOT NULL,
	"perusahaan" text NOT NULL,
	"jabatan" text NOT NULL,
	"signature_data_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_roster_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"employee_id" varchar,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" text NOT NULL,
	"nomor_lambung" text,
	"roster_sesuai" boolean NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_roster_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal_pelaksanaan" text NOT NULL,
	"jam_pelaksanaan" text NOT NULL,
	"shift" text NOT NULL,
	"perusahaan" text NOT NULL,
	"departemen" text NOT NULL,
	"lokasi" text NOT NULL,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_seatbelt_observers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"nama" text NOT NULL,
	"nik" text NOT NULL,
	"perusahaan" text NOT NULL,
	"jabatan" text NOT NULL,
	"signature_data_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_seatbelt_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" varchar NOT NULL,
	"employee_id" varchar,
	"ordinal" integer NOT NULL,
	"nama" text NOT NULL,
	"nik" text,
	"nomor_lambung" text,
	"perusahaan" text NOT NULL,
	"seatbelt_driver_condition" boolean NOT NULL,
	"seatbelt_passenger_condition" boolean NOT NULL,
	"seatbelt_driver_usage" boolean NOT NULL,
	"seatbelt_passenger_usage" boolean NOT NULL,
	"keterangan" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sidak_seatbelt_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tanggal_pelaksanaan" text NOT NULL,
	"jam_pelaksanaan" text NOT NULL,
	"shift" text NOT NULL,
	"shift_type" text DEFAULT 'Shift 1' NOT NULL,
	"lokasi" text NOT NULL,
	"total_sampel" integer DEFAULT 0 NOT NULL,
	"activity_photos" text[],
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "simper_monitoring" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_name" text NOT NULL,
	"nik" varchar NOT NULL,
	"simper_bib_expired_date" text,
	"simper_tia_expired_date" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "simper_monitoring_nik_unique" UNIQUE("nik")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_users" ADD CONSTRAINT "auth_users_nik_employees_id_fk" FOREIGN KEY ("nik") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_history" ADD CONSTRAINT "leave_history_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_history" ADD CONSTRAINT "leave_history_leave_request_id_leave_requests_id_fk" FOREIGN KEY ("leave_request_id") REFERENCES "public"."leave_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_reminders" ADD CONSTRAINT "leave_reminders_leave_request_id_leave_requests_id_fk" FOREIGN KEY ("leave_request_id") REFERENCES "public"."leave_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_reminders" ADD CONSTRAINT "leave_reminders_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_schedules" ADD CONSTRAINT "roster_schedules_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_patrol_attendance" ADD CONSTRAINT "safety_patrol_attendance_report_id_safety_patrol_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."safety_patrol_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_patrol_raw_messages" ADD CONSTRAINT "safety_patrol_raw_messages_report_id_safety_patrol_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."safety_patrol_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_fatigue_observers" ADD CONSTRAINT "sidak_fatigue_observers_session_id_sidak_fatigue_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_fatigue_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_fatigue_records" ADD CONSTRAINT "sidak_fatigue_records_session_id_sidak_fatigue_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_fatigue_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_fatigue_records" ADD CONSTRAINT "sidak_fatigue_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_rambu_observations" ADD CONSTRAINT "sidak_rambu_observations_session_id_sidak_rambu_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_rambu_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_rambu_observers" ADD CONSTRAINT "sidak_rambu_observers_session_id_sidak_rambu_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_rambu_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_roster_observers" ADD CONSTRAINT "sidak_roster_observers_session_id_sidak_roster_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_roster_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_roster_records" ADD CONSTRAINT "sidak_roster_records_session_id_sidak_roster_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_roster_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_roster_records" ADD CONSTRAINT "sidak_roster_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_seatbelt_observers" ADD CONSTRAINT "sidak_seatbelt_observers_session_id_sidak_seatbelt_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_seatbelt_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_seatbelt_records" ADD CONSTRAINT "sidak_seatbelt_records_session_id_sidak_seatbelt_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sidak_seatbelt_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidak_seatbelt_records" ADD CONSTRAINT "sidak_seatbelt_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_announcement_reads_announcement" ON "announcement_reads" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "IDX_announcement_reads_employee" ON "announcement_reads" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "announcement_reads_unique" ON "announcement_reads" USING btree ("announcement_id","employee_id");--> statement-breakpoint
CREATE INDEX "IDX_announcements_created_at" ON "announcements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_announcements_is_active" ON "announcements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_attendance_date" ON "attendance_records" USING btree ("date");--> statement-breakpoint
CREATE INDEX "IDX_attendance_employee" ON "attendance_records" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "IDX_attendance_employee_date" ON "attendance_records" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "IDX_attendance_status" ON "attendance_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_auth_users_nik" ON "auth_users" USING btree ("nik");--> statement-breakpoint
CREATE INDEX "IDX_documents_category" ON "documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_documents_created_at" ON "documents" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_documents_is_active" ON "documents" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_employees_name" ON "employees" USING btree ("name");--> statement-breakpoint
CREATE INDEX "IDX_employees_status" ON "employees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_employees_department" ON "employees" USING btree ("department");--> statement-breakpoint
CREATE INDEX "IDX_news_created_at" ON "news" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "IDX_news_is_active" ON "news" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_news_is_important" ON "news" USING btree ("is_important");--> statement-breakpoint
CREATE INDEX "IDX_push_subscriptions_employee" ON "push_subscriptions" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "IDX_push_subscriptions_is_active" ON "push_subscriptions" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_unique" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "IDX_roster_date" ON "roster_schedules" USING btree ("date");--> statement-breakpoint
CREATE INDEX "IDX_roster_employee" ON "roster_schedules" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "IDX_roster_employee_date" ON "roster_schedules" USING btree ("employee_id","date");--> statement-breakpoint
CREATE INDEX "IDX_roster_shift" ON "roster_schedules" USING btree ("shift");--> statement-breakpoint
CREATE INDEX "IDX_roster_status" ON "roster_schedules" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_sp_attendance_report" ON "safety_patrol_attendance" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "IDX_sp_attendance_unit" ON "safety_patrol_attendance" USING btree ("unit_code");--> statement-breakpoint
CREATE INDEX "IDX_sp_raw_sender" ON "safety_patrol_raw_messages" USING btree ("sender_phone");--> statement-breakpoint
CREATE INDEX "IDX_sp_raw_processed" ON "safety_patrol_raw_messages" USING btree ("processed");--> statement-breakpoint
CREATE INDEX "IDX_sp_raw_msg_timestamp" ON "safety_patrol_raw_messages" USING btree ("message_timestamp");--> statement-breakpoint
CREATE INDEX "IDX_safety_patrol_tanggal" ON "safety_patrol_reports" USING btree ("tanggal");--> statement-breakpoint
CREATE INDEX "IDX_safety_patrol_jenis" ON "safety_patrol_reports" USING btree ("jenis_laporan");--> statement-breakpoint
CREATE INDEX "IDX_safety_patrol_status" ON "safety_patrol_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "IDX_safety_patrol_sender" ON "safety_patrol_reports" USING btree ("sender_phone");--> statement-breakpoint
CREATE INDEX "IDX_safety_patrol_kegiatan" ON "safety_patrol_reports" USING btree ("kegiatan");--> statement-breakpoint
CREATE INDEX "IDX_safety_patrol_bulan" ON "safety_patrol_reports" USING btree ("bulan");--> statement-breakpoint
CREATE INDEX "IDX_sp_templates_category" ON "safety_patrol_templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "IDX_sp_templates_active" ON "safety_patrol_templates" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "IDX_fatigue_observers_session" ON "sidak_fatigue_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_fatigue_records_session" ON "sidak_fatigue_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_fatigue_records_employee" ON "sidak_fatigue_records" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sidak_fatigue_session_ordinal_unique" ON "sidak_fatigue_records" USING btree ("session_id","ordinal");--> statement-breakpoint
CREATE INDEX "IDX_fatigue_sessions_created_by" ON "sidak_fatigue_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_roster_observers_session" ON "sidak_roster_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_roster_records_session" ON "sidak_roster_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_roster_records_employee" ON "sidak_roster_records" USING btree ("employee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sidak_roster_session_ordinal_unique" ON "sidak_roster_records" USING btree ("session_id","ordinal");--> statement-breakpoint
CREATE INDEX "IDX_roster_sessions_created_by" ON "sidak_roster_sessions" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "IDX_seatbelt_observers_session" ON "sidak_seatbelt_observers" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "IDX_seatbelt_records_session" ON "sidak_seatbelt_records" USING btree ("session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sidak_seatbelt_session_ordinal_unique" ON "sidak_seatbelt_records" USING btree ("session_id","ordinal");--> statement-breakpoint
CREATE INDEX "IDX_seatbelt_sessions_created_by" ON "sidak_seatbelt_sessions" USING btree ("created_by");