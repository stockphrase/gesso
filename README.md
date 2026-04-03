# Gesso

**Painting over Canvas** — A minimal course management platform for professors.

Gesso replaces bloated LMS platforms like Canvas with a clean, fast, invitation-only alternative built for small writing courses and seminars.

## Stack

Next.js 16 · Tailwind CSS · Supabase (PostgreSQL + Auth + Storage) · JSZip · Vercel

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

## Roles

**Admin (Professor)** — creates courses, manages roster, uploads files via ZIP, creates assignments with draft stages and due dates, downloads and returns student submissions, edits syllabus and contact info.

**Tutor** — accesses level 1+2 course files, downloads student submissions, bulk-downloads returned work as ZIP, posts announcements stamped with name and role.

**Student** — submits assignment drafts, tracks submission status, downloads returned work, views course files, syllabus, announcements, and contact info.

## Registration

Invitation only. Add emails via the admin People page or directly in Supabase:

```sql
INSERT INTO allowed_emails (email, role, course_id)
VALUES ('professor@university.edu', 'admin', NULL);
```

## Design

Black and white. No clutter. Grid-based tile navigation. Red accent for admin UI. Inspired by [shape.work](https://shape.work).


