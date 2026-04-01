'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import AdminHeader from '@/components/AdminHeader'
import { getActiveCourse } from '@/utils/course'

export default function AdminPeoplePage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,       setProfile]       = useState(null)
  const [courseId,      setCourseId]      = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [studentEmails, setStudentEmails] = useState('')
  const [tutorEmails,   setTutorEmails]   = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saved,         setSaved]         = useState(false)
  const [error,         setError]         = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (prof?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(prof)

      const course = getActiveCourse()
      if (!course) { router.push('/courses'); return }
      setCourseId(course.id)

      const { data } = await supabase
        .from('allowed_emails')
        .select('email, role')
        .eq('course_id', course.id)

      const students = data?.filter(e => e.role === 'student').map(e => e.email).join('\n') || ''
      const tutors   = data?.filter(e => e.role === 'tutor').map(e => e.email).join('\n') || ''
      setStudentEmails(students)
      setTutorEmails(tutors)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const parseEmails = (text, role) =>
      text.split('\n')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0)
        .map(email => ({ course_id: courseId, email, role }))

    const allRows = [
      ...parseEmails(studentEmails, 'student'),
      ...parseEmails(tutorEmails, 'tutor'),
    ]

    // Replace all allowed emails for this course
    const { error: delError } = await supabase
      .from('allowed_emails').delete().eq('course_id', courseId)
    if (delError) { setError(delError.message); setSaving(false); return }

    if (allRows.length > 0) {
      const { error: insError } = await supabase
        .from('allowed_emails').insert(allRows)
      if (insError) { setError(insError.message); setSaving(false); return }
    }

    // Enroll any existing users whose emails are now on the list
    for (const row of allRows) {
      const { data: existingUser } = await supabase
        .from('profiles').select('id').eq('email', row.email).maybeSingle()
      if (!existingUser) continue

      const { data: existing } = await supabase
        .from('course_memberships')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('course_memberships').insert({
          course_id: courseId,
          user_id:   existingUser.id,
          role:      row.role,
        })
      }
    }

    setSaved(true)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/admin" name={profile?.name} />
      <main className="p-8 max-w-2xl">
        <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-8">People</h1>
        <form onSubmit={handleSave} className="flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold tracking-widest uppercase block mb-1">Student Emails</label>
            <p className="text-xs text-gray-400 mb-2">One email address per line.</p>
            <textarea
              value={studentEmails}
              onChange={e => setStudentEmails(e.target.value)}
              rows={8}
              placeholder={'student@example.com\nanother@example.com'}
              className="border border-black p-3 w-full text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-y"
            />
          </div>
          <div>
            <label className="text-xs font-bold tracking-widest uppercase block mb-1">Tutor Emails</label>
            <p className="text-xs text-gray-400 mb-2">One email address per line.</p>
            <textarea
              value={tutorEmails}
              onChange={e => setTutorEmails(e.target.value)}
              rows={4}
              placeholder="tutor@example.com"
              className="border border-black p-3 w-full text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-y"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-xs font-bold tracking-widest uppercase">Saved.</p>}
          <button type="submit" disabled={saving}
            className="bg-black text-white p-3 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Roster'}
          </button>
        </form>
      </main>
    </div>
  )
}
