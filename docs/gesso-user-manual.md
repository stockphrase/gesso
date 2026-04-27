# Gesso User Manual

*A clean, minimal course management platform for writing instructors.*

---

## About Gesso

Gesso is a course management platform built as a lightweight alternative to Canvas LMS. It focuses on the work that matters in writing courses — submitting drafts, returning marked work, sharing materials, and posting announcements — without behavioral tracking or third-party data sharing.

This manual is split into two parts: **For Teachers** and **For Students**. Tutors should read both, since their role borrows from each.

---

## Getting Started (Everyone)

### Accounts and registration

Gesso uses an invitation-based whitelist. You cannot self-register from a generic signup page; your email address must first be added to a course roster by a teacher or admin. Once you are on a roster, you can register with that email and set a password.

### Signing in

Visit your institution's Gesso URL and sign in with the email and password you registered with. If you forget your password, use the password reset link on the sign-in screen.

### Switching courses

If you belong to more than one course (a student in two classes, a teacher running multiple sections, a tutor assigned across courses), you can switch between them from your account without logging out.

---

## For Teachers

As a teacher, you have full control over your course: roster, syllabus, announcements, files, and assignments. The sections below walk through each responsibility.

### Setting up a course

When you create a course, the first things to configure are the syllabus, the roster, and your assignments. There is no required order, but most teachers start with the syllabus so students see something meaningful when they first log in.

### Managing the roster

Add people to the course by email address. There are three role levels:

- **Teacher** — full course control (you).
- **Tutor** — can view and download submissions and post announcements, but cannot create assignments or edit course settings.
- **Student** — can submit work and view course materials.

Adding an email to the roster also adds it to the registration whitelist, so the person can create an account if they don't already have one. Removing someone from the roster removes their access to the course.

### Writing the syllabus

The syllabus editor accepts Markdown. Write in plain text with standard Markdown formatting — headings with `#`, lists with `-`, links with `[text](url)`, emphasis with `*` or `**` — and Gesso renders it as a clean read-only page for students. Update it whenever you need to; students always see the latest version.

### Posting announcements

Announcements are dated posts that appear on the course page. Use them for class cancellations, schedule changes, reading reminders, or anything else students should see when they log in. Students view announcements in an accordion sorted by date, with the newest at the top. Tutors can also post announcements.

### Distributing files

Upload course materials as ZIP archives. Inside the ZIP, you can organize files however you like — by week, by unit, by reading — and Gesso will preserve that structure for students and tutors to browse. Use this for readings, handouts, prompt sheets, sample essays, or anything else you'd hand out in class.

### Creating assignments

Assignments in Gesso are built around **multi-stage drafts**. A single assignment can have multiple stages (for example: proposal, first draft, revised draft, final), each with its own due date.

When you create an assignment:

1. Give it a title and description.
2. Add stages, with a due date for each.
3. Publish it to the course.

Students will see the assignment with each stage and its deadline. As deadlines pass, Gesso marks submissions as **late** or **overdue** automatically — you don't have to track this yourself.

### Reviewing and returning work

Once students start submitting, you can view all submissions in one place. For each stage, you can see who has submitted, when, and whether they were on time.

To return marked work:

1. Download the student's submission.
2. Mark it up in your editor of choice (Word, Google Docs, PDF annotator — whatever you use).
3. Upload the marked file back through Gesso's one-click return.

The student gets the returned file in their account and can download it whenever they need to.

### Ending a course

When the course is over, you can delete it. This removes all submissions, files, and records associated with the course. This is by design — Gesso treats students' work as belonging to them, not to the platform — so make sure you've kept any local copies you need before deleting.

---

## For Students

As a student, your job in Gesso is to submit drafts on time, download what your teacher posts, and keep up with announcements. The sections below cover everything you'll do.

### Joining a course

You can't sign up for Gesso on your own. Your teacher adds your email to the course roster, and once they do, you can register with that email and choose a password. If you've tried to register and gotten an error, your email probably hasn't been added yet — message your teacher.

### Finding your way around

Once you log in, you'll see your course (or a list of courses, if you're enrolled in more than one). Inside a course, the main areas are the **syllabus**, **announcements**, **files**, and **assignments**.

### Reading the syllabus

The syllabus is the official document for the course — policies, schedule, grading, expectations. Your teacher writes it in Markdown, and you see a clean rendered version. Check it when you have a question about course structure before you ask.

### Checking announcements

Announcements appear in an accordion sorted by date, newest first. Click one to expand it. Get in the habit of checking announcements when you log in, especially before class — that's where teachers post cancellations, room changes, and reminders.

### Downloading course files

Your teacher uploads readings and handouts as files you can download. Browse the files area and grab what you need. If something looks missing, check announcements or message your teacher.

### Submitting drafts

Most assignments in Gesso have multiple stages — for example, a proposal, a first draft, and a final draft, each with its own due date. To submit:

1. Open the assignment.
2. Find the stage that's currently due.
3. Upload your file.

You can usually replace your submission until the deadline passes, so if you find a typo right after uploading, you can fix it. After the deadline, your submission is locked in and marked **late** or **overdue** if it came in past the due date.

**A few practical tips:**

- Submit something rather than nothing. A late draft is almost always worth more than a missing one.
- Check the file after you upload it. Open it from your account to make sure the right version went up.
- Name your file something sensible — `lastname-draft1.docx` is much friendlier to your teacher than `Document (3) FINAL final.docx`.

### Getting marked work back

When your teacher returns a marked draft, it shows up in your account under the assignment. Download it, read the comments, and use them on the next stage. The whole point of the multi-stage workflow is that feedback on one stage feeds into the next.

### Privacy

Gesso doesn't track your behavior, sell your data, or hand it to third parties. When your course ends and your teacher deletes it, your submissions and records go with it. If you want to keep your work, save local copies before the course ends.

---

## For Tutors

Tutors sit between teachers and students. You can:

- View and download student submissions
- Post announcements

You cannot create assignments, edit the syllabus, or manage the roster — those stay with the teacher. If you need to give feedback on student work, follow your teacher's workflow for getting marked files back to students (usually you'll mark and return them through the teacher, or the teacher will grant you return access on a per-assignment basis).

---

## Troubleshooting

**I can't register.** Your email isn't on a course roster yet. Ask your teacher to add it.

**I can't see an assignment.** It may not be published yet, or you may be looking at a different course. Check the course switcher.

**My submission is marked late.** The deadline for that stage has passed. Submit anyway — late is better than missing — and talk to your teacher if there's a reason.

**A file won't upload.** Check the file size and format. If it's still failing, try a different browser or a smaller file.

**I deleted a course by accident.** Course deletion is permanent and removes all associated data. There is no undo. This is intentional — Gesso doesn't keep shadow copies of deleted courses.

---

## Getting help

For questions about your specific course — deadlines, expectations, grading — ask your teacher.

For technical issues with Gesso itself, contact your institution's Gesso administrator. The project source is at [github.com/stockphrase/gesso](https://github.com/stockphrase/gesso).
