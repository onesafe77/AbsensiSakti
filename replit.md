# AttendanceQR - Employee Attendance Management System

## Overview
AttendanceQR is a web-based employee attendance management system that uses QR codes for secure check-ins. Its purpose is to streamline attendance, manage employee data, generate secure QR codes, track attendance, manage work rosters, handle leave requests, and produce comprehensive reports. The system provides real-time monitoring dashboards with visual analytics and robust security through token-based QR code validation, offering a complete solution for workforce management with significant market potential.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend Framework**: React with TypeScript (Vite)
- **UI Kit**: Shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS (with dark mode support)
- **Design Principles**: Focus on intuitive interfaces, mobile-first design for specific modules (e.g., Mobile Driver View, SIDAK), and professional presentation in reports (e.g., consistent gray headers, company logos, optimized layouts).

### Technical Implementations
- **Backend Runtime**: Node.js with Express.js (modular RESTful API)
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Forms**: React Hook Form with Zod validation
- **Data Storage**: PostgreSQL with Drizzle ORM (Neon serverless)
- **File Storage**: Replit Object Storage (Google Cloud Storage) for persistent file uploads
  - SIDAK activity photos use presigned URL upload flow
  - Files stored at `/objects/*` path, served via GET /objects/* endpoint
  - Old local file storage deprecated in favor of permanent cloud storage
- **Data Access**: Repository pattern
- **Authentication**: Token-based QR code validation (employee ID + secret key hashing)
- **Concurrency**: Optimistic locking with retry mechanism
- **Caching**: Server-side caching with targeted invalidation

### Feature Specifications
- **QR Code Workflow**: Generation, secure token embedding, validation, and attendance recording.
- **Roster Management**: Employee scheduling, bulk/individual Excel uploads, monthly calendar view (desktop & mobile) with shift filtering, color-coded badges, and "Nomor Lambung" tracking with fallback logic.
- **Mobile Driver View**: Dedicated mobile interface with horizontal-scrollable tabs (Roster, Cuti, Pemberitahuan, SIMPER), compact vertical roster lists with infinite scroll, and smart filtering. Includes announcement notification system with unread count badge.
- **Leave Management**: Request submission, approval workflow, calendar integration, and analytics.
- **Meeting Management**: Create meetings with QR code attendance, manual entry, photo uploads, and professional PDF reports.
- **SIDAK (Field Inspection System)**: Mobile-first forms (Fatigue and Roster types) with multi-step wizards, observer verification, digital signatures, and professional, exact-layout PDF exports. Supports QR code scanning for employee data auto-fill and optimized PDF generation. **Riwayat SIDAK per akun** - setiap supervisor hanya melihat SIDAK yang mereka buat, admin dapat melihat semua.
  - **SIDAK Roster**: QR-based employee entry with real-time shift validation (ensures driver is scheduled for current shift), auto-fill from roster database (Nama, NIK, Roster Sesuai, Hari Kerja from roster.hariKerja column), with only Nomor Lambung editable. Observers input manually (no QR required).
  - **SIDAK Fatigue**: QR-based employee entry with manual observer input and digital signatures.
- **Evaluasi Driver**: Monthly driver evaluation dashboard showing SIDAK Fatigue participation. Features include summary cards (Total Driver, Sudah/Belum SIDAK, Total SIDAK), interactive charts (Bar chart for top 10 drivers, Pie chart for status comparison), searchable table with driver details, month/year filter, status filter (Semua/Sudah/Belum SIDAK), and Excel/PDF export functionality.
- **Reporting System**: Exportable PDF/CSV reports with date range filtering, professional styling, activity photos, and enhanced status indicators.
- **Real-time Dashboard**: Live attendance statistics, visual charts, and auto-refresh.
- **Employee Management**: CRUD operations, bulk import via Excel, NIK-based search.
- **Shift System**: Automatic detection for "Shift 1" (06:00-18:00) and "Shift 2" (18:00-06:00).
- **Auto Save**: Draft recovery for forms using local storage.
- **Announcement System**: Admin-managed announcements for drivers with image attachments. Features include read tracking (who read + timestamp), unread count badge on mobile driver view, admin dashboard with reader statistics per announcement, and PDF export of reader lists with names and timestamps.
- **News/Berita System**: Company-wide news separate from driver-only announcements. Admin-managed with important news flag for automatic push notification broadcast. API endpoints for CRUD operations.
- **PWA (Progressive Web App)**: Installable app with manifest.json, service worker for offline caching, and "Add to Home Screen" capability for mobile users.
- **Push Notification System**: Web Push API with VAPID authentication for sending notifications to subscribed users. Features include:
  - Employee subscription management (subscribe/unsubscribe endpoints)
  - Test notifications for individual employees
  - Broadcast notifications to all subscribers
  - Automatic push for important news
  - Shift reminders (planned)
  - Leave status updates (planned)
  - SIMPER expiry alerts (planned)
- **Safety Patrol System**: WhatsApp-based reporting via notif.my.id gateway with AI-powered parsing.
  - **Webhook Integration**: Receives WhatsApp messages at `/api/webhook/whatsapp` from notif.my.id
  - **Supports image messages with captions** - Processes both text and image messages
  - **Dual AI Parser (Gemini + OpenAI)**: Primary parsing with Gemini, automatic fallback to OpenAI (gpt-4o-mini) if Gemini fails (quota exceeded, errors, etc.)
  - **Smart Field Extraction**: AI automatically extracts all available fields from messages without requiring templates:
    - tanggal, bulan, week (auto-calculated from date: 1-7=W1, 8-14=W2, 15-21=W3, 22-28=W4, 29-31=W5)
    - waktuPelaksanaan, shift (detected from time or keywords)
    - lokasi (location keywords like KM, Site, Area, Workshop)
    - kegiatan (activity type), namaPelaksana (supports 2 names comma-separated)
    - temuan (findings), pemateri (presenters), attendance, rosterOff
  - **Multi-Photo Support**: Photos sent within ±10 seconds of the main message (based on WhatsApp timestamp, not database timestamp) are automatically aggregated into the same report. Image-only messages are stored as raw messages and picked up by the aggregation logic when the main message creates the report - no fallback to prevent wrong-report attachment.
  - **Thumbnail Preview**: Table shows actual image thumbnails (up to 2) instead of just count badge
  - **Database Tables**: `safety_patrol_reports` (main data), `safety_patrol_attendance` (unit attendance), `safety_patrol_raw_messages` (audit trail), `safety_patrol_templates` (knowledge templates)
  - **Enhanced Report Fields**: Full activity tracking with:
    - tanggal (date), bulan (auto-calculated month name), week (auto-calculated week number)
    - waktuPelaksanaan (activity time), shift, lokasi (location)
    - kegiatan (activity type from template matching)
    - namaPelaksana (person in charge), pemateri (presenters)
    - temuan (findings/observations), buktiKegiatan (evidence photos)
  - **Admin Dashboard**: Statistics cards, horizontal-scrollable table with all fields, detail modal with tabs (Info/Attendance/Raw Message/AI Analysis)
  - **Unit Tracking**: Monitors 10 units (RBT, BMT, AEK, GECL, BBS, MMS, BKAE, MAV, KMB, RAM)
  - **Knowledge Templates System**: Modular template system for defining report formats to improve AI parsing accuracy
    - Template fields: name, category, description, exampleMessage, matchingKeywords, promptContext, expectedFields
    - TemplateResolver service with keyword matching for auto-detection of report types
    - Context injection into Gemini prompts for improved extraction
    - Admin UI for CRUD operations on templates (list, create, edit, delete)
    - 11 default templates: Wake Up Call, Daily Briefing, Safety Meeting P5M, P2H LV, Sidak Roster, Sidak Kelengkapan DT, Observasi Give Way Sign, Observasi Jarak Aman, Observasi Kecepatan Berkendara, Temuan, Pelanggaran
  - **Future-proof Architecture**: Modular design to support additional messaging platforms (WAHA, Telegram)

## External Dependencies
- **QR Code Generation**: `qrcode.js`
- **QR Code Scanning**: `jsQR`
- **Charts**: `Chart.js`
- **PDF Generation**: `jsPDF`
- **Date Handling**: `date-fns`
- **Camera Access**: Browser MediaDevices API