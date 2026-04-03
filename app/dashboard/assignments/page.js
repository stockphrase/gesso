'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import Header from '@/components/Header'
import { getActiveCourse } from '@/utils/course'

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function isLate(submittedAt, dueDate) {
  if (!submittedAt || !dueDate) return false
  return new Date(submittedAt) > new Date(dueDate)
}

// ── Tutor view ────────────────────────────────────────────────────────────────
function TutorAssignmentsView({ profile, assignments, courseId }) {
  const supabase    = createClient()
  const [selected,  setSelected]  = useState(null)
  const [students,  setStudents]  = useState([])
  const [subs,      setSubs]      = useState([])
  const [loading,   setLoading]   = useState(false)
  const [downloading, setDownloading] = useState(null)
  const [zipping,   setZipping]   = useState(null)

  async function openAssignment(assignment) {
    setSelected(assignment)
    setLoading(true)

    const { data: memberships } = await supabase
      .from('course_memberships').select('user_id').eq('course_id', courseId).eq('role', 'student')
    const userIds = memberships?.map(m => m.user_id) || []

    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds)
      setStudents(profiles?.filter(Boolean) || [])
    } else {
      setStudents([])
    }

    const { data: submissions } = await supabase
      .from('submissions').select('*').eq('assignment_id', assignment.id)
    setSubs(submissions || [])
    setLoading(false)
  }

  function getSub(userId, stage) {
    return subs.find(s => s.user_id === userId && s.draft_stage === stage)
  }

  async function downloadSingle(sub) {
    setDownloading(sub.id)
    try {
      const res  = await fetch(`/api/submissions/admin-download?submission_id=${sub.id}`)
      const data = await res.json()
      if (data.url) {
        const blob    = await fetch(data.url).then(r => r.blob())
        const blobUrl = URL.createObjectURL(blob)
        const a       = document.createElement('a')
        a.href        = blobUrl
        a.download    = data.filename
        a.click()
        URL.revokeObjectURL(blobUrl)
      }
    } finally {
      setDownloading(null)
    }
  }

  async function downloadReturnedZip(stage) {
    setZipping(stage)
    try {
      const JSZip = (await import('jszip')).default
      const zip   = new JSZip()
      const returned = subs.filter(s => s.draft_stage === stage && s.returned_storage_path)

      for (const sub of returned) {
        const student = students.find(s => s.id === sub.user_id)
        if (!student) continue
        const res  = await fetch(`/api/submissions/download-returned?submission_id=${sub.id}`)
        const data = await res.json()
        if (!data.url) continue
        const blob = await fetch(data.url).then(r => r.blob())
        const ext  = sub.returned_filename.split('.').pop()
        const name = `${student.name}_${selected.title}_${stage}_returned.${ext}`.replace(/\s+/g, '_')
        zip.file(name, blob)
      }

      const content = await zip.generateAsync({ type: 'blob' })
      const blobUrl = URL.createObjectURL(content)
      const a       = document.createElement('a')
      a.href        = blobUrl
      a.download    = `${selected.title}_${stage}_returned.zip`.replace(/\s+/g, '_')
      a.click()
      URL.revokeObjectURL(blobUrl)
    } finally {
      setZipping(null)
    }
  }

  if (selected) {
    return (
      <div>
        <div className="flex items-baseline gap-6 mb-8">
          <button onClick={() => setSelected(null)}
            className="text-xs font-bold tracking-widest uppercase text-black underline">
            ← Back
          </button>
          <h2 className="text-xs font-bold tracking-widest uppercase text-black">{selected.title}</h2>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 mb-8 border border-black p-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
            <span className="text-xs font-bold tracking-widest uppercase">Not submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs font-bold tracking-widest uppercase">Submitted</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs font-bold tracking-widest uppercase">Returned</span>
          </div>
        </div>
        {loading ? (
          <p className="text-xs font-bold tracking-widest uppercase">Loading...</p>
        ) : students.length === 0 ? (
          <p className="text-xs font-bold tracking-widest uppercase">No students enrolled.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs font-bold tracking-widest uppercase">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left p-3 border-r border-black">Student</th>
                  {selected.draft_stages.map(stage => (
                    <th key={stage} className="text-left p-3 border-r border-black last:border-r-0">
                      <div>{stage}</div>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => downloadReturnedZip(stage)} disabled={zipping === stage}
                          className="text-xs border border-black px-2 py-1 hover:bg-black hover:text-white transition-colors disabled:opacity-40 normal-case">
                          {zipping === stage ? 'Zipping...' : '↓ Download All'}
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map(student => (
                  <tr key={student.id} className="border-b border-black last:border-b-0">
                    <td className="p-3 border-r border-black">{student.name}</td>
                    {selected.draft_stages.map(stage => {
                      const sub  = getSub(student.id, stage)
                      const due  = selected.due_dates?.[stage]
                      const late = sub && isLate(sub.submitted_at, due)
                      return (
                        <td key={stage} className="p-3 border-r border-black last:border-r-0">
                          {!sub ? (
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                              <span className="text-gray-400">Not submitted</span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full shrink-0 ${sub.returned_at ? 'bg-blue-500' : 'bg-green-500'}`} />
                                <button onClick={() => downloadSingle(sub)} disabled={downloading === sub.id}
                                  className="underline hover:no-underline">
                                  {downloading === sub.id ? 'Downloading...' : '↓ Download'}
                                </button>
                                {late && <span className="text-red-500">LATE</span>}
                              </div>
                              <span className="text-gray-400 font-normal normal-case tracking-normal">{formatDate(sub.submitted_at)}</span>
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
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-8">Assignments</h1>
      {assignments.length === 0 ? (
        <p className="text-xs font-bold tracking-widest uppercase text-black">No assignments yet.</p>
      ) : (
        <div className="border-t border-black">
          {assignments.map(a => (
            <button key={a.id} onClick={() => openAssignment(a)}
              className="w-full border-b border-black flex items-center justify-between py-4 px-2 hover:bg-black hover:text-white transition-colors group text-left">
              <p className="text-xs font-bold tracking-widest uppercase">{a.title}</p>
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400 group-hover:text-gray-300 shrink-0 ml-4">
                {a.draft_stages.length} stage{a.draft_stages.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Student view ──────────────────────────────────────────────────────────────
export default function AssignmentsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,     setProfile]    = useState(null)
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [courseId,    setCourseId]   = useState(null)
  const [loading,     setLoading]    = useState(true)
  const [uploading,   setUploading]  = useState(null)
  const [downloading, setDownloading] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (!prof || prof.role === 'admin') { router.push('/dashboard'); return }
      setProfile(prof)

      const course = getActiveCourse()
      if (!course) { router.push('/courses'); return }
      setCourseId(course.id)

      const { data: asgn } = await supabase
        .from('assignments').select('*').eq('course_id', course.id).order('position')
      setAssignments(asgn || [])

      if (prof.role === 'student') {
        const { data: subs } = await supabase
          .from('submissions').select('*').eq('user_id', user.id)
        setSubmissions(subs || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  function getSubmission(assignmentId, stage) {
    return submissions.find(s => s.assignment_id === assignmentId && s.draft_stage === stage)
  }

  async function handleSubmit(assignment, stage, file) {
    const key = `${assignment.id}-${stage}`
    setUploading(key)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('assignment_id', assignment.id)
    fd.append('draft_stage', stage)
    const res  = await fetch('/api/submissions/submit', { method: 'POST', body: fd })
    const data = await res.json()
    
    if (data.success) {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: subs } = await supabase.from('submissions').select('*').eq('user_id', user.id)
    setSubmissions(subs || [])
} else {
  alert(data.error || 'Upload failed. Please try again.')
}
setUploading(null)
  }

  async function downloadReturn(sub) {
    setDownloading(sub.id)
    try {
      const res  = await fetch(`/api/submissions/download?submission_id=${sub.id}`)
      const data = await res.json()
      if (data.url) {
        const blob    = await fetch(data.url).then(r => r.blob())
        const blobUrl = URL.createObjectURL(blob)
        const a       = document.createElement('a')
        a.href        = blobUrl
        a.download    = data.filename
        a.click()
        URL.revokeObjectURL(blobUrl)
      }
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Header backHref="/dashboard" name={profile?.name} />
      <main className="p-8">

        {/* Tutor view */}
        {profile?.role === 'tutor' && (
          <TutorAssignmentsView
            profile={profile}
            assignments={assignments}
            courseId={courseId}
          />
        )}

        {/* Student view */}
        {profile?.role === 'student' && (
          <>
            <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-4">Assignments</h1>
            <div className="flex flex-wrap items-center gap-6 mb-8 border border-black p-4">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-xs font-bold tracking-widest uppercase">Not submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                <span className="text-xs font-bold tracking-widest uppercase">Submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-xs font-bold tracking-widest uppercase">Returned</span>
              </div>
            </div>
            {assignments.length === 0 ? (
              <p className="text-xs font-bold tracking-widest uppercase text-black">No assignments yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-xs font-bold tracking-widest uppercase">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left p-3 border-r border-black">Assignment</th>
                      {[...new Set(assignments.flatMap(a => a.draft_stages))].map(stage => (
                        <th key={stage} className="text-left p-3 border-r border-black last:border-r-0">{stage}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map(assignment => (
                      <tr key={assignment.id} className="border-b border-black last:border-b-0">
                        <td className="p-3 border-r border-black">
                          <p>{assignment.title}</p>
                          {assignment.description && (
                            <p className="text-gray-400 font-normal normal-case mt-1 tracking-normal">{assignment.description}</p>
                          )}
                          {assignment.due_dates && Object.keys(assignment.due_dates).length > 0 && (
                            <div className="mt-2 flex flex-col gap-1">
                              {assignment.draft_stages.map(stage => (
                                assignment.due_dates[stage] ? (
                                  <p key={stage} className="text-gray-400 font-normal normal-case tracking-normal">
                                    {stage}: due {new Date(assignment.due_dates[stage]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </p>
                                ) : null
                              ))}
                            </div>
                          )}
                        </td>
                        {[...new Set(assignments.flatMap(a => a.draft_stages))].map(stage => {
                          const sub     = getSubmission(assignment.id, stage)
                          const key     = `${assignment.id}-${stage}`
                          const isStage = assignment.draft_stages.includes(stage)
                          const due     = assignment.due_dates?.[stage]
                          const late    = sub && isLate(sub.submitted_at, due)

                          if (!isStage) {
                            return <td key={stage} className="p-3 border-r border-black last:border-r-0 bg-gray-50" />
                          }

                          return (
                            <td key={stage} className="p-3 border-r border-black last:border-r-0">
                              {!sub ? (
                                <label className="flex items-center gap-2 cursor-pointer group">
                                  <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                                  <span className="underline group-hover:no-underline">
                                    {uploading === key ? 'Uploading...' : 'Upload'}
                                  </span>
                                  <input type="file" className="hidden" disabled={uploading === key}
                                    onChange={e => { if (e.target.files[0]) handleSubmit(assignment, stage, e.target.files[0]) }} />
                                </label>
                              ) : sub.returned_at ? (
                                <div className="flex flex-col gap-1">
                                  <button onClick={() => downloadReturn(sub)} disabled={downloading === sub.id}
                                    className="flex items-center gap-2 group cursor-pointer">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                                    <span>{downloading === sub.id ? 'Downloading...' : 'Returned'}</span>
                                    <span className="font-mono text-gray-400 group-hover:underline">{downloading === sub.id ? '' : 'Download'}</span>
                                    {late && <span className="text-red-500">LATE</span>}
                                  </button>
                                  <span className="text-gray-400 font-normal normal-case tracking-normal">{formatDate(sub.submitted_at)}</span>
                                </div>
                              ) : (
                                <label className="flex flex-col gap-1 cursor-pointer group">
                                  <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                                    <span>{uploading === key ? 'Uploading...' : 'Submitted'}</span>
                                    <span className="font-mono text-gray-400">{uploading === key ? '' : 'Resubmit'}</span>
                                    {late && <span className="text-red-500">LATE</span>}
                                  </div>
                                  <span className="text-gray-400 font-normal normal-case tracking-normal">{formatDate(sub.submitted_at)}</span>
                                  <input type="file" className="hidden" disabled={uploading === key}
                                    onChange={e => { if (e.target.files[0]) handleSubmit(assignment, stage, e.target.files[0]) }} />
                                </label>
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
          </>
        )}
      </main>
    </div>
  )
}
