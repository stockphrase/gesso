"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase";
import AdminHeader from "@/components/AdminHeader";
import { getActiveCourse } from "@/utils/course";

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

function isLate(submittedAt, dueDate) {
  if (!submittedAt || !dueDate) return false;
  return new Date(submittedAt) > new Date(dueDate);
}

// ── Email modal ───────────────────────────────────────────────────────────────
function EmailModal({ stage, students, submissions, onClose }) {
  const [copied, setCopied] = useState(null);

  const submitted = students.filter(s =>
    submissions.find(sub => sub.user_id === s.id && sub.draft_stage === stage)
  );
  const notSubmitted = students.filter(s =>
    !submissions.find(sub => sub.user_id === s.id && sub.draft_stage === stage)
  );

  function copyEmails(list) {
    const emails = list.map(s => s.email).join(', ');
    navigator.clipboard.writeText(emails);
    setCopied(list === submitted ? 'submitted' : 'notSubmitted');
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white border border-black p-6 max-w-lg w-full"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-xs font-bold tracking-widest uppercase">{stage} — Submission Status</h2>
          <button onClick={onClose}
            className="text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-black">
            Close
          </button>
        </div>
        <p className="text-xs text-gray-400 font-normal normal-case tracking-normal leading-relaxed mb-6">
          Use the Copy Emails buttons below to copy a list of addresses directly into your email client's To field. Send a reminder to students who have not yet submitted, or follow up with those who have.
        </p>
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-bold tracking-widest uppercase text-orange-500">
              Not Submitted ({notSubmitted.length})
            </p>
            {notSubmitted.length > 0 && (
              <button onClick={() => copyEmails(notSubmitted)}
                className="text-xs font-bold tracking-widest uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors">
                {copied === 'notSubmitted' ? 'Copied!' : 'Copy Emails'}
              </button>
            )}
          </div>
          {notSubmitted.length === 0 ? (
            <p className="text-xs text-gray-400 normal-case tracking-normal">All students have submitted.</p>
          ) : (
            <div className="border border-black p-3 bg-gray-50 text-xs font-normal normal-case tracking-normal text-gray-700 leading-relaxed break-all">
              {notSubmitted.map(s => s.email).join(', ')}
            </div>
          )}
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-2">
            <p className="text-xs font-bold tracking-widest uppercase text-green-600">
              Submitted ({submitted.length})
            </p>
            {submitted.length > 0 && (
              <button onClick={() => copyEmails(submitted)}
                className="text-xs font-bold tracking-widest uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors">
                {copied === 'submitted' ? 'Copied!' : 'Copy Emails'}
              </button>
            )}
          </div>
          {submitted.length === 0 ? (
            <p className="text-xs text-gray-400 normal-case tracking-normal">No submissions yet.</p>
          ) : (
            <div className="border border-black p-3 bg-gray-50 text-xs font-normal normal-case tracking-normal text-gray-700 leading-relaxed break-all">
              {submitted.map(s => s.email).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAssignmentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState(null);
  const [courseId, setCourseId] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selected, setSelected] = useState(null);
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [downloading, setDownloading] = useState(null);
  const [zipping, setZipping] = useState(null);
  const [emailModal, setEmailModal] = useState(null);

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState(["Draft 1", "Final Draft"]);
  const [dueDates, setDueDates] = useState({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  // Edit form state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStages, setEditStages] = useState([]);
  const [editDueDates, setEditDueDates] = useState({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (prof?.role !== "admin") { router.push("/dashboard"); return; }
      setProfile(prof);
      const course = getActiveCourse();
      if (!course) { router.push("/courses"); return; }
      setCourseId(course.id);
      await loadAssignments(course.id);
      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAssignments(cid) {
    const { data } = await supabase.from("assignments").select("*").eq("course_id", cid).order("position");
    setAssignments(data || []);
  }

  async function openAssignment(assignment) {
    setSelected(assignment);
    const { data: memberships } = await supabase
      .from("course_memberships").select("user_id").eq("course_id", courseId).eq("role", "student");
    const userIds = memberships?.map((m) => m.user_id) || [];
    if (userIds.length === 0) {
      setStudents([]);
    } else {
      const { data: studentProfiles } = await supabase.from("profiles").select("*").in("id", userIds);
      setStudents(studentProfiles?.filter(Boolean) || []);
    }
    const { data: subs } = await supabase.from("submissions").select("*").eq("assignment_id", assignment.id);
    setSubmissions(subs || []);
  }

  function openEdit(a, e) {
    e.stopPropagation();
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditDescription(a.description || "");
    setEditStages([...a.draft_stages]);
    setEditDueDates({ ...a.due_dates });
    setEditError(null);
  }

  function closeEdit() {
    setEditingId(null);
    setEditError(null);
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);
    const { error } = await supabase.from("assignments").update({
      title: editTitle,
      description: editDescription,
      draft_stages: editStages,
      due_dates: editDueDates,
    }).eq("id", editingId);
    if (error) { setEditError(error.message); setEditSaving(false); return; }
    await loadAssignments(courseId);
    closeEdit();
    setEditSaving(false);
  }

  function addEditStage() { setEditStages([...editStages, `Draft ${editStages.length + 1}`]); }
  function updateEditStage(i, val) {
    const s = [...editStages]; const old = s[i]; s[i] = val; setEditStages(s);
    if (editDueDates[old]) { const d = { ...editDueDates, [val]: editDueDates[old] }; delete d[old]; setEditDueDates(d); }
  }
  function removeEditStage(i) {
    const s = editStages[i]; setEditStages(editStages.filter((_, idx) => idx !== i));
    const d = { ...editDueDates }; delete d[s]; setEditDueDates(d);
  }
  function moveEditStage(i, dir) {
    const s = [...editStages];
    const j = i + dir;
    if (j < 0 || j >= s.length) return;
    [s[i], s[j]] = [s[j], s[i]];
    setEditStages(s);
  }
  function updateEditDueDate(stage, val) { setEditDueDates({ ...editDueDates, [stage]: val }); }

  function getSubmission(userId, stage) {
    return submissions.find((s) => s.user_id === userId && s.draft_stage === stage);
  }

  async function handleReturn(submission, file) {
    setReturning(submission.id);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("submission_id", submission.id);
    const res = await fetch("/api/submissions/return", { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) {
      const { data: subs } = await supabase.from("submissions").select("*").eq("assignment_id", selected.id);
      setSubmissions(subs || []);
    }
    setReturning(null);
  }

  async function downloadSingle(sub) {
    setDownloading(sub.id);
    try {
      const res = await fetch(`/api/submissions/admin-download?submission_id=${sub.id}`);
      const data = await res.json();
      if (data.url) {
        const blob = await fetch(data.url).then((r) => r.blob());
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = data.filename;
        a.click();
        URL.revokeObjectURL(blobUrl);
      }
    } finally {
      setDownloading(null);
    }
  }

  async function downloadStageZip(stage) {
    setZipping(stage);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      const subs = submissions.filter((s) => s.draft_stage === stage && s.storage_path);
      for (const sub of subs) {
        const student = students.find((s) => s.id === sub.user_id);
        if (!student) continue;
        const res = await fetch(`/api/submissions/admin-download?submission_id=${sub.id}`);
        const data = await res.json();
        if (!data.url) continue;
        const blob = await fetch(data.url).then((r) => r.blob());
        const ext = sub.filename.split(".").pop();
        const name = `${student.name}_${selected.title}_${stage}.${ext}`.replace(/\s+/g, "_");
        zip.file(name, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${selected.title}_${stage}.zip`.replace(/\s+/g, "_");
      a.click();
      URL.revokeObjectURL(blobUrl);
    } finally {
      setZipping(null);
    }
  }

  async function handleBulkReturn(stage, file) {
    setReturning(`bulk-${stage}`);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      let returned = 0;
      for (const student of students) {
        const namePart = student.name.replace(/\s+/g, "_");
        const matchingFile = Object.keys(zip.files).find(
          (f) => f.toLowerCase().includes(namePart.toLowerCase()) && !zip.files[f].dir,
        );
        if (!matchingFile) continue;
        const sub = getSubmission(student.id, stage);
        if (!sub) continue;
        const fileData = await zip.files[matchingFile].async("blob");
        const fd = new FormData();
        fd.append("file", new File([fileData], matchingFile.split("/").pop()));
        fd.append("submission_id", sub.id);
        await fetch("/api/submissions/return", { method: "POST", body: fd });
        returned++;
      }
      const { data: subs } = await supabase.from("submissions").select("*").eq("assignment_id", selected.id);
      setSubmissions(subs || []);
      alert(`Returned ${returned} file(s) successfully.`);
    } finally {
      setReturning(null);
    }
  }

  async function handleCreateAssignment(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const { error } = await supabase.from("assignments").insert({
      course_id: courseId,
      title,
      description,
      draft_stages: stages,
      due_dates: dueDates,
      position: assignments.length,
    });
    if (error) { setFormError(error.message); setSaving(false); return; }
    await loadAssignments(courseId);
    setTitle("");
    setDescription("");
    setStages(["Draft 1", "Final Draft"]);
    setDueDates({});
    setShowForm(false);
    setSaving(false);
  }

  function addStage() { setStages([...stages, `Draft ${stages.length + 1}`]); }
  function updateStage(i, val) {
    const s = [...stages]; const old = s[i]; s[i] = val; setStages(s);
    if (dueDates[old]) { const d = { ...dueDates, [val]: dueDates[old] }; delete d[old]; setDueDates(d); }
  }
  function removeStage(i) {
    const s = stages[i]; setStages(stages.filter((_, idx) => idx !== i));
    const d = { ...dueDates }; delete d[s]; setDueDates(d);
  }
  function updateDueDate(stage, val) { setDueDates({ ...dueDates, [stage]: val }); }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">Loading...</p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader onBack={() => setSelected(null)} name={profile?.name} />
        {emailModal && (
          <EmailModal
            stage={emailModal}
            students={students}
            submissions={submissions}
            onClose={() => setEmailModal(null)}
          />
        )}
        <main className="p-8">
          <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-2">{selected.title}</h1>
          {selected.description && <p className="text-sm text-gray-500 mb-4">{selected.description}</p>}
          {selected.due_dates && Object.keys(selected.due_dates).length > 0 && (
            <div className="flex flex-wrap gap-4 mb-8">
              {selected.draft_stages.map((stage) =>
                selected.due_dates[stage] ? (
                  <div key={stage} className="flex items-stretch">
                    <div className="text-xs font-bold tracking-widest uppercase border border-black border-r-0 px-3 py-2">
                      {stage}: Due{" "}
                      {new Date(selected.due_dates[stage]).toLocaleDateString("en-US",
                        { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                    <button
                      onClick={() => setEmailModal(stage)}
                      className="border border-black px-3 py-2 bg-white hover:bg-red-500 transition-colors"
                      style={{ color: '#ef4444' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = '#ef4444'}>
                      ✉
                    </button>
                  </div>
                ) : null,
              )}
            </div>
          )}
          {students.length === 0 ? (
            <p className="text-xs font-bold tracking-widest uppercase text-black">No students enrolled.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs font-bold tracking-widest uppercase">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left p-3 border-r border-black">Student</th>
                    {selected.draft_stages.map((stage) => (
                      <th key={stage} className="text-left p-3 border-r border-black last:border-r-0">
                        <div>{stage}</div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => downloadStageZip(stage)} disabled={zipping === stage}
                            className="text-xs font-bold tracking-widest border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors disabled:opacity-40 normal-case">
                            {zipping === stage ? "Zipping..." : "↓ All"}
                          </button>
                          <label className="text-xs font-bold tracking-widest border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors cursor-pointer normal-case">
                            {returning === `bulk-${stage}` ? "Returning..." : "↑ Return All"}
                            <input type="file" accept=".zip" className="hidden"
                              disabled={returning === `bulk-${stage}`}
                              onChange={(e) => { if (e.target.files[0]) handleBulkReturn(stage, e.target.files[0]); }} />
                          </label>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-black last:border-b-0">
                      <td className="p-3 border-r border-black">{student.name}</td>
                      {selected.draft_stages.map((stage) => {
                        const sub = getSubmission(student.id, stage);
                        const due = selected.due_dates?.[stage];
                        const late = sub && isLate(sub.submitted_at, due);
                        const overdue = !sub && due && new Date() > new Date(due);
                        return (
                          <td key={stage} className="p-3 border-r border-black last:border-r-0">
                            {!sub ? (
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full shrink-0 ${overdue ? "bg-orange-500" : "bg-red-500"}`} />
                                <span className="text-gray-400">Not submitted</span>
                                {overdue && <span className="text-orange-500">OVERDUE</span>}
                              </div>
                            ) : sub.returned_at ? (
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                                  <span>Returned</span>
                                  {late && <span className="text-red-500">LATE</span>}
                                </div>
                                <span className="text-gray-400 font-normal normal-case tracking-normal">{formatDate(sub.submitted_at)}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                                  <span>{sub.filename}</span>
                                  {late && <span className="text-red-500">LATE</span>}
                                </div>
                                <span className="text-gray-400 font-normal normal-case tracking-normal">{formatDate(sub.submitted_at)}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => downloadSingle(sub)} disabled={downloading === sub.id}
                                    className="border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors disabled:opacity-40">
                                    {downloading === sub.id ? "Downloading..." : "↓ Download"}
                                  </button>
                                  <label className="cursor-pointer border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors">
                                    {returning === sub.id ? "Uploading..." : "↑ Return"}
                                    <input type="file" className="hidden" disabled={returning === sub.id}
                                      onChange={(e) => { if (e.target.files[0]) handleReturn(sub, e.target.files[0]); }} />
                                  </label>
                                </div>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/admin" name={profile?.name} />
      <main className="p-8">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-xs font-bold tracking-widest uppercase text-black">Assignments</h1>
          <button onClick={() => { setShowForm(!showForm); closeEdit(); }}
            className="text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
            {showForm ? "Cancel" : "+ New Assignment"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreateAssignment} className="border border-black p-6 mb-8 flex flex-col gap-4">
            <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required
              className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <textarea placeholder="Description (optional)" value={description}
              onChange={(e) => setDescription(e.target.value)} rows={3}
              className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-3">Draft Stages & Due Dates</p>
              <div className="flex flex-col gap-3">
                {stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={stage} onChange={(e) => updateStage(i, e.target.value)}
                      className="border border-black p-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-black" />
                    <input type="date" value={dueDates[stage] || ""} onChange={(e) => updateDueDate(stage, e.target.value)}
                      className="border border-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                    <button type="button" onClick={() => removeStage(i)}
                      className="text-xs font-bold tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addStage}
                className="mt-3 text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
                + Add Stage
              </button>
            </div>
            {formError && <p className="text-red-600 text-sm">{formError}</p>}
            <button type="submit" disabled={saving}
              className="bg-black text-white p-3 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50">
              {saving ? "Saving..." : "Create Assignment"}
            </button>
          </form>
        )}

        {assignments.length === 0 ? (
          <p className="text-xs font-bold tracking-widest uppercase text-black">No assignments yet.</p>
        ) : (
          <div className="border-t border-black">
            {assignments.map((a) => (
              <div key={a.id}>
                <div className="w-full border-b border-black flex items-center justify-between py-4 px-2 group">
                  <button onClick={() => openAssignment(a)}
                    className="flex-1 flex items-center justify-between hover:opacity-70 transition-opacity text-left">
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase">{a.title}</p>
                      {a.description && <p className="text-sm text-gray-500 mt-1">{a.description}</p>}
                    </div>
                    <p className="text-xs font-bold tracking-widest uppercase text-gray-400 shrink-0 ml-4">
                      {a.draft_stages.length} stage{a.draft_stages.length !== 1 ? "s" : ""}
                    </p>
                  </button>
                  <button onClick={(e) => editingId === a.id ? closeEdit() : openEdit(a, e)}
                    className="ml-4 text-xs font-bold tracking-widest uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors shrink-0">
                    {editingId === a.id ? "Cancel" : "Edit"}
                  </button>
                </div>

                {/* Edit form */}
                {editingId === a.id && (
                  <form onSubmit={handleSaveEdit} className="border-b border-black p-6 bg-white flex flex-col gap-4">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required
                      placeholder="Title"
                      className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                      placeholder="Description (optional)"
                      className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
                    <div>
                      <p className="text-xs font-bold tracking-widest uppercase mb-3">Draft Stages & Due Dates</p>
                      <div className="flex flex-col gap-3">
                        {editStages.map((stage, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="flex flex-col gap-1">
                              <button type="button" onClick={() => moveEditStage(i, -1)} disabled={i === 0}
                                className="text-xs border border-black px-1 hover:bg-black hover:text-white transition-colors disabled:opacity-20">↑</button>
                              <button type="button" onClick={() => moveEditStage(i, 1)} disabled={i === editStages.length - 1}
                                className="text-xs border border-black px-1 hover:bg-black hover:text-white transition-colors disabled:opacity-20">↓</button>
                            </div>
                            <input type="text" value={stage} onChange={(e) => updateEditStage(i, e.target.value)}
                              className="border border-black p-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-black" />
                            <input type="date" value={editDueDates[stage] || ""} onChange={(e) => updateEditDueDate(stage, e.target.value)}
                              className="border border-black p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                            <button type="button" onClick={() => removeEditStage(i)}
                              className="text-xs font-bold tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors">
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      <button type="button" onClick={addEditStage}
                        className="mt-3 text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
                        + Add Stage
                      </button>
                    </div>
                    {editError && <p className="text-red-600 text-sm">{editError}</p>}
                    <button type="submit" disabled={editSaving}
                      className="bg-black text-white p-3 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50">
                      {editSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </form>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
