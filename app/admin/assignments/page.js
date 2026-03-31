'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import AdminHeader from '@/components/AdminHeader'

export default function AdminAssignmentsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,     setProfile]     = useState(null)
  const [courseId,    setCourseId]     = useState(null)
  const [assignments, setAssignments]  = useState([])
  const [selected,    setSelected]     = useState(null)
  const [students,    setStudents]     = useState([])
  const [submissions, setSubmissions]  = useState([])
  const [loading,     setLoading]      = useState(true)
  const [returning,   setReturning]    = useState(null)

  const [showForm,    setShowForm]    = useState(false)
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [stages,      setStages]      = useState(['Draft 1', 'Final Draft'])
  const [saving,      setSaving]      = useState(false)
  const [formError,   setFormError]   = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (prof?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(prof)

      const { data: membership } = await supabase
        .from('course_memberships')
        .select('course_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!membership) { setLoading(false); return }
      setCourseId(membership.course_id)

      await loadAssignments(membership.course_id)
      setLoading(false)
    }
    load()
  }, [])

  async function loadAssignments(cid) {
    const { data } = await supabase
      .from('assignments').select('*').eq('course_id', cid).order('position')
    setAssignments(data || [])
  }

  async function openAssignment(assignment) {
    setSelected(assignment)

    const { data: memberships } = await supabase
      .from('course_memberships')
      .select('user_id')
      .eq('course_id', courseId)
      .eq('role', 'student')

    const userIds = memberships?.map(m => m.user_id) || []

    if (userIds.length === 0) {
      setStudents([])
    } else {
      const { data: studentProfiles } = await supabase
        .from('profiles').select('*').in('id', userIds)
      setStudents(studentProfiles?.filter(Boolean) || [])
    }

    const { data: subs } = await supabase
      .from('submissions').select('*').eq('assignment_id', assignment.id)
    setSubmissions(subs || [])
  }

  function getSubmission(userId, stage) {
    return submissions.find(s => s.user_id === userId && s.draft_stage === stage)
  }

  async function handleReturn(submission, file) {
    setReturning(submission.id)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('submission_id', submission.id)

    const res  = await fetch('/api/submissions/return', { method: 'POST', body: fd })
    const data = await res.json()

    if (data.success) {
      const { data: subs } = await supabase
        .from('submissions').select('*').eq('assignment_id', selected.id)
      setSubmissions(subs || [])
    }
    setReturning(null)
  }

  async function handleCreateAssignment(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    const { error } = await supabase.from('assignments').insert({
      course_id:    courseId,
      title,
      description,
      draft_stages: stages,
      position:     assignments.length,
    })

    if (error) { setFormError(error.message); setSaving(false); return }

    await loadAssignments(courseId)
    setTitle('')
    setDescription('')
    setStages(['Draft 1', 'Final Draft'])
    setShowForm(false)
    setSaving(false)
  }

  function addStage() { setStages([...stages, `Draft ${stages.length + 1}`]) }
  function updateStage(i, val) { const s = [...stages]; s[i] = val; setStages(s) }
  function removeStage(i) { setStages(stages.filter((_, idx) => idx !== i)) }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">Loading...</p>
      </div>
    )
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader onBack={() => setSelected(null)} name={profile?.name} />
        <main className="p-8">
          <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-2">{selected.title}</h1>
          {selected.description && (
            <p className="text-sm text-gray-500 mb-8">{selected.description}</p>
          )}
          {students.length === 0 ? (
            <p className="text-xs font-bold tracking-widest uppercase text-black">No students enrolled.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs font-bold tracking-widest uppercase">
                <thead>
                  <tr className="border-b border-black">
                    <th className="text-left p-3 border-r border-black">Student</th>
                    {selected.draft_stages.map(stage => (
                      <th key={stage} className="text-left p-3 border-r border-black last:border-r-0">{stage}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id} className="border-b border-black last:border-b-0">
                      <td className="p-3 border-r border-black">{student.name}</td>
                      {selected.draft_stages.map(stage => {
                        const sub = getSubmission(student.id, stage)
                        return (
                          <td key={stage} className="p-3 border-r border-black last:border-r-0">
                            {!sub ? (
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                                <span className="text-gray-400">Not submitted</span>
                              </div>
                            ) : sub.returned_at ? (
                              <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                                <span>Returned</span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                                  <span>{sub.filename}</span>
                                </div>
                                <label className="cursor-pointer border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors inline-block">
                                  {returning === sub.id ? 'Uploading...' : 'Return'}
                                  <input type="file" className="hidden" disabled={returning === sub.id}
                                    onChange={e => { if (e.target.files[0]) handleReturn(sub, e.target.files[0]) }} />
                                </label>
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/admin" name={profile?.name} />
      <main className="p-8">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-xs font-bold tracking-widest uppercase text-black">Assignments</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
            {showForm ? 'Cancel' : '+ New Assignment'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateAssignment} className="border border-black p-6 mb-8 flex flex-col gap-4">
            <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required
              className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <textarea placeholder="Description (optional)" value={description}
              onChange={e => setDescription(e.target.value)} rows={3}
              className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-3">Draft Stages</p>
              <div className="flex flex-col gap-2">
                {stages.map((stage, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="text" value={stage} onChange={e => updateStage(i, e.target.value)}
                      className="border border-black p-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-black" />
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
              {saving ? 'Saving...' : 'Create Assignment'}
            </button>
          </form>
        )}

        {assignments.length === 0 ? (
          <p className="text-xs font-bold tracking-widest uppercase text-black">No assignments yet.</p>
        ) : (
          <div className="border-t border-black">
            {assignments.map(a => (
              <button key={a.id} onClick={() => openAssignment(a)}
                className="w-full border-b border-black flex items-center justify-between py-4 px-2 hover:bg-black hover:text-white transition-colors group text-left">
                <div>
                  <p className="text-xs font-bold tracking-widest uppercase">{a.title}</p>
                  {a.description && (
                    <p className="text-sm text-gray-500 group-hover:text-gray-300 mt-1">{a.description}</p>
                  )}
                </div>
                <p className="text-xs font-bold tracking-widest uppercase text-gray-400 group-hover:text-gray-300 shrink-0 ml-4">
                  {a.draft_stages.length} stage{a.draft_stages.length !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}