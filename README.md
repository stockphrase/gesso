# Gesso

**Painting over Canvas** — A minimal course management platform for professors.

Gesso replaces bloated LMS platforms like Canvas with a clean, fast, invitation-only alternative built for small writing courses and seminars.

---

## Stack

Next.js 16 · Tailwind CSS · Supabase (PostgreSQL + Auth + Storage) · JSZip · Vercel

---

## Setup

```bash
git clone https://github.com/stockphrase/gesso.git
cd gesso
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

---

## Roles

**Admin (Professor)** — creates courses, manages roster, uploads files via ZIP, creates assignments with draft stages and due dates, downloads and returns student submissions, edits syllabus and contact info.

**Tutor** — accesses level 1+2 course files, downloads student submissions, bulk-downloads returned work as ZIP, posts announcements stamped with name and role.

**Student** — submits assignment drafts, tracks submission status, downloads returned work, views course files, syllabus, announcements, and contact info.

---

## Registration

Invitation only. Add emails via the admin People page or directly in Supabase:

```sql
INSERT INTO allowed_emails (email, role, course_id)
VALUES ('professor@university.edu', 'admin', NULL);
```

---

## Security

### Authentication
All authentication is handled by Supabase Auth using industry-standard JWT-based sessions. Passwords are hashed with bcrypt and never stored in plain text. Password strength is enforced at registration — users must achieve a "Strong" rating (12+ characters, mixed case, numbers, and symbols) before an account can be created.

### Invitation-Only Registration
Registration is closed by default. Users can only create an account if their email address has been pre-approved by an administrator. Attempting to register with an unapproved email is rejected before any account creation occurs.

### Role-Based Access Control
Gesso enforces three roles — Admin, Tutor, and Student — at multiple layers:

- **Middleware** — route-level protection prevents unauthenticated users from accessing any protected page, and non-admin users from accessing admin routes
- **Page-level checks** — every page verifies the user's role before rendering
- **API route checks** — every API endpoint independently verifies authentication and role before processing any request
- **Database RLS** — Supabase Row Level Security policies enforce access rules at the database level, so even direct API calls cannot bypass permissions

### Data Isolation
Each course's data is isolated by course membership. Students and tutors can only access data for courses they are enrolled in. Professors can only manage courses they created.

### File Access Control
Course files are organized into permission levels:

- **Level 1** — accessible to all enrolled users (admin, tutor, student)
- **Level 2** — accessible to admin and tutor only
- **Level 3** — accessible to admin only

Files are stored in a private Supabase Storage bucket. All downloads use short-lived signed URLs (valid for 60 seconds) generated server-side — files are never directly publicly accessible.

### Email Obfuscation
Professor email addresses are obfuscated in the student-facing contact page. The address is assembled client-side at interaction time and never appears as plain text in the HTML source, reducing exposure to automated scraping.

### File Size Limits
- Student assignment submissions: 10MB maximum
- Course file ZIP uploads: 30MB maximum

These limits are enforced server-side in the API routes, independent of any client-side validation.

### Transport Security
All traffic is served over HTTPS via Vercel's managed TLS certificates. The Supabase connection also operates exclusively over HTTPS.

### Environment Variables
Sensitive credentials are stored as environment variables and never committed to the repository.

---

## Design

Black and white. No clutter. Grid-based tile navigation. Red accent for admin UI. Inspired by [shape.work](https://shape.work).


