'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import Header from '@/components/Header'

export default function StudentAssignmentsPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,     setProfile]     = useState(null)
  const [assignments, setAssignments]  = useState([])
  const [submissions, setSubmissions]  = useState([])
  const [loading,     setLoading]      = useState(true)
  const [uploading,   setUploading]    = useState(null) // 'assignmentId-stage'
  const [downloading, setDownloading]  = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (!prof || prof.role !== 'student') { router.push('/dashboard'); return }
      setProfile(prof)

      const { data: membership } = await supabase
        .from('course_memberships')
        .select('course_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (!membership) { setLoading(false); return }

      const { data: asgn } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', membership.course_id)
        .order('position')

      setAssignments(asgn || [])

      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)

      setSubmissions(subs || [])
      setLoading(false)
    }
    load()
  }, [])

  function getSubmission(assignmentId, stage) {
    return submissions.find(
      s => s.assignment_id === assignmentId && s.draft_stage === stage
    )
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
      // Refresh submissions
      const { data: { user } } = await supabase.auth.getUser()
      const { data: subs } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', user.id)
      setSubmissions(subs || [])
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
        <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-4">
          Assignments
        </h1>

        {/* Legend */}
        <div className="flex items-center gap-6 mb-8 border border-black p-4 inline-flex">
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
          <p className="text-xs font-bold tracking-widest uppercase text-black">
            No assignments yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs font-bold tracking-widest uppercase">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left p-3 border-r border-black">Assignment</th>
                  {/* Render all unique stages across all assignments */}
                  {[...new Set(assignments.flatMap(a => a.draft_stages))].map(stage => (
                    <th key={stage} className="text-left p-3 border-r border-black last:border-r-0">
                      {stage}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map(assignment => (
                  <tr key={assignment.id} className="border-b border-black last:border-b-0">
                    <td className="p-3 border-r border-black">
                      <p>{assignment.title}</p>
                      {assignment.description && (
                        <p className="text-gray-400 font-normal normal-case mt-1 tracking-normal">
                          {assignment.description}
                        </p>
                      )}
                    </td>
                    {[...new Set(assignments.flatMap(a => a.draft_stages))].map(stage => {
                      const sub = getSubmission(assignment.id, stage)
                      const key = `${assignment.id}-${stage}`
                      const isStage = assignment.draft_stages.includes(stage)

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
                              <input
                                type="file"
                                className="hidden"
                                disabled={uploading === key}
                                onChange={e => {
                                  if (e.target.files[0]) handleSubmit(assignment, stage, e.target.files[0])
                                }}
                              />
                            </label>
                          ) : sub.returned_at ? (
                            <button
                              onClick={() => downloadReturn(sub)}
                              disabled={downloading === sub.id}
                              className="flex items-center gap-2 group"
                            >
                              <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                              <span className="underline group-hover:no-underline">
                                {downloading === sub.id ? 'Downloading...' : 'Download'}
                              </span>
                            </button>
                          ) : (
                            <label className="flex items-center gap-2 cursor-pointer group">
                              <span className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                              <span className="underline group-hover:no-underline">
                                {uploading === key ? 'Uploading...' : 'Resubmit'}
                              </span>
                              <input
                                type="file"
                                className="hidden"
                                disabled={uploading === key}
                                onChange={e => {
                                  if (e.target.files[0]) handleSubmit(assignment, stage, e.target.files[0])
                                }}
                              />
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
      </main>
    </div>
  )
}
