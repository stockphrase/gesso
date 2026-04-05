"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/utils/supabase";
import AdminHeader from "@/components/AdminHeader";
import { clearActiveCourse } from "@/utils/course";

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CourseSettingsPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (prof?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setProfile(prof);

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", params.courseId)
        .single();
      if (!courseData) {
        router.push("/courses");
        return;
      }
      setCourse(courseData);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      // Load all data needed for the export
      const { data: memberships } = await supabase
        .from("course_memberships")
        .select("user_id, role")
        .eq("course_id", params.courseId)
        .eq("role", "student");

      const userIds = memberships?.map((m) => m.user_id) || [];

      const { data: students } =
        userIds.length > 0
          ? await supabase
              .from("profiles")
              .select("id, name, email")
              .in("id", userIds)
          : { data: [] };

      const { data: assignments } = await supabase
        .from("assignments")
        .select("id, title, draft_stages, due_dates")
        .eq("course_id", params.courseId)
        .order("position");

      const { data: submissions } = await supabase
        .from("submissions")
        .select("*")
        .in("assignment_id", assignments?.map((a) => a.id) || []);

      // Build CSV rows
      const rows = [
        [
          "Course",
          "Student",
          "Email",
          "Assignment",
          "Stage",
          "Submitted",
          "Submitted At",
          "Late",
          "Returned",
          "Returned At",
        ],
      ];

      for (const student of students || []) {
        for (const assignment of assignments || []) {
          for (const stage of assignment.draft_stages) {
            const sub = submissions?.find(
              (s) =>
                s.user_id === student.id &&
                s.assignment_id === assignment.id &&
                s.draft_stage === stage,
            );
            const dueDate = assignment.due_dates?.[stage];
            const late =
              sub?.submitted_at && dueDate
                ? new Date(sub.submitted_at) > new Date(dueDate)
                  ? "Yes"
                  : "No"
                : "—";

            rows.push([
              course.title,
              student.name,
              student.email,
              assignment.title,
              stage,
              sub ? "Yes" : "No",
              sub ? formatDate(sub.submitted_at) : "—",
              late,
              sub?.returned_at ? "Yes" : "No",
              sub?.returned_at ? formatDate(sub.returned_at) : "—",
            ]);
          }
        }
      }

      // Convert to CSV string
      const csv = rows
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
        )
        .join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${course.title.replace(/\s+/g, "_")}_records.csv`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirm !== course.title) return;
    setDeleting(true);

    await supabase.from("allowed_emails").delete().eq("course_id", course.id);
    await supabase
      .from("course_memberships")
      .delete()
      .eq("course_id", course.id);
    await supabase.from("announcements").delete().eq("course_id", course.id);
    await supabase.from("assignments").delete().eq("course_id", course.id);
    await supabase.from("syllabi").delete().eq("course_id", course.id);
    await supabase.from("contact_info").delete().eq("course_id", course.id);
    await supabase.from("file_folders").delete().eq("course_id", course.id);
    await supabase.from("courses").delete().eq("id", course.id);

    clearActiveCourse();
    router.push("/courses");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">
          Loading...
        </p>
      </div>
    );
  }

  const canDelete = confirm === course.title;

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/courses" name={profile?.name} />
      <main className="p-8 max-w-lg">
        <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-2">
          Course Settings
        </h1>
        <p className="text-2xl font-black text-black tracking-tight mb-12">
          {course.title}
        </p>

        {/* Export records */}
        <div className="border border-black p-6 flex flex-col gap-4 mb-8">
          <p className="text-xs font-bold tracking-widest uppercase text-black">
            Export Records
          </p>
          <p className="text-sm text-black">
            Download a CSV of all student submissions, timestamps, and return
            status for this course. Recommended before deleting.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="border border-black text-black p-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
          >
            {exporting ? "Exporting..." : "↓ Download Records (.csv)"}
          </button>
        </div>

        {/* Danger zone */}
        <div className="border border-red-600 p-6 flex flex-col gap-4">
          <p className="text-xs font-bold tracking-widest uppercase text-red-600">
            Danger Zone
          </p>
          <p className="text-sm text-black">
            Permanently delete{" "}
            <span className="font-black">{course.title}</span> and all its data
            — assignments, submissions, files, announcements, syllabus, and
            roster. This cannot be undone.
          </p>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-widest uppercase text-gray-500">
              Type <span className="text-black">{course.title}</span> to confirm
            </label>
            <input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
              placeholder={course.title}
            />
          </div>
          <button
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            className="bg-red-600 text-white p-3 text-xs font-bold tracking-widest uppercase hover:bg-red-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {deleting ? "Deleting..." : "Delete This Course"}
          </button>
        </div>
      </main>
    </div>
  );
}
