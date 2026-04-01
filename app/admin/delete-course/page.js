'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import AdminHeader from '@/components/AdminHeader'

export default function AdminCoursesPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,    setProfile]    = useState(null)
  const [courses,    setCourses]    = useState([])
  const [selected,   setSelected]   = useState(null)
  const [loading,    setLoading]    = useState(true)

  // Create course form
  const [showForm,   setShowForm]   = useState(false)
  const [newTitle,   setNewTitle]   = useState('')
  const [newDesc,    setNewDesc]    = useState('')
  const [creating,   setCreating]   = useState(false)
  const [createErr,  setCreateErr]  = useState(null)

  // Manage course
  const [studentEmails, setStudentEmails] = useState('')
  const [tutorEmails,   setTutorEmails]   = useState('')
  const [savingEmails,  setSavingEmails]  = useState(false)
  const [emailSaved,    setEmailSaved]    = useState(false)
  const [emailErr,      setEmailErr]      = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (prof?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(prof)

      await loadCourses()
      setLoading(false)
    }
    load()
  }, [])

  async function loadCourses() {
    const { data } = await supabase
      .from('courses').select('*').order('created_at', { ascending: false })
    setCourses(data || [])
  }

  async function openCourse(course) {
    setSelected(course)
    setEmailSaved(false)
    setEmailErr(null)

    const { data } = await supabase
      .from('allowed_emails')
      .select('email, role')
      .eq('course_id', course.id)

    const students = data?.filter(e => e.role === 'student').map(e => e.email).join('\n') || ''
    const tutors   = data?.filter(e => e.role === 'tutor').map(e => e.email).join('\n') || ''
    setStudentEmails(students)
    setTutorEmails(tutors)
  }

  async function handleCreateCourse(e) {
    e.preventDefault()
    setCreating(true)
    setCreateErr(null)

    const { data: course, error } = await supabase
      .from('courses')
      .insert({ title: newTitle, description: newDesc, created_by: profile.id })
      .select()
      .single()

    if (error) { setCreateErr(error.message); setCreating(false); return }

    // Auto-enroll the admin in the new course
    await supabase.from('course_memberships').insert({
      course_id: course.id,
      user_id:   profile.id,
      role:      'admin',
    })

    await loadCourses()
    setNewTitle('')
    setNewDesc('')
    setShowForm(false)
    setCreating(false)
  }

  async function handleSaveEmails(e) {
    e.preventDefault()
    setSavingEmails(true)
    setEmailSaved(false)
    setEmailErr(null)

    const parseEmails = (text, role) =>
      text.split('\n')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.length > 0)
        .map(email => ({ course_id: selected.id, email, role }))

    const studentRows = parseEmails(studentEmails, 'student')
    const tutorRows   = parseEmails(tutorEmails, 'tutor')
    const allRows     = [...studentRows, ...tutorRows]

    // Delete existing allowed emails for this course and replace
    const { error: delError } = await supabase
      .from('allowed_emails')
      .delete()
      .eq('course_id', selected.id)

    if (delError) { setEmailErr(delError.message); setSavingEmails(false); return }

    if (allRows.length > 0) {
      const { error: insError } = await supabase
        .from('allowed_emails')
        .insert(allRows)

      if (insError) { setEmailErr(insError.message); setSavingEmails(false); return }
    }

    // Also enroll any existing users whose emails are now on the list
    for (const row of allRows) {
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', row.email)
        .maybeSingle()

      if (!existingUser) continue

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('course_memberships')
        .select('id')
        .eq('course_id', selected.id)
        .eq('user_id', existingUser.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('course_memberships').insert({
          course_id: selected.id,
          user_id:   existingUser.id,
          role:      row.role,
        })
      }
    }

    setEmailSaved(true)
    setSavingEmails(false)
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${selected.title}" and ALL its data? This cannot be undone.`)) return
    setDeleting(true)
    await supabase.from('allowed_emails').delete().eq('course_id', selected.id)
    await supabase.from('course_memberships').delete().eq('course_id', selected.id)
    await supabase.from('announcements').delete().eq('course_id', selected.id)
    await supabase.from('assignments').delete().eq('course_id', selected.id)
    await supabase.from('syllabi').delete().eq('course_id', selected.id)
    await supabase.from('contact_info').delete().eq('course_id', selected.id)
    await supabase.from('courses').delete().eq('id', selected.id)
    await loadCourses()
    setSelected(null)
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">Loading...</p>
      </div>
    )
  }

  // Course management view
  if (selected) {
    return (
      <div className="min-h-screen bg-gray-100">
        <AdminHeader onBack={() => setSelected(null)} name={profile?.name} />
        <main className="p-8 max-w-2xl">
          <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-8">People</h1>

          {/* Allowed emails form */}
          <form onSubmit={handleSaveEmails} className="flex flex-col gap-6 mb-12">
            <div>
              <label className="text-xs font-bold tracking-widest uppercase block mb-1">
                Student Emails
              </label>
              <p className="text-xs text-gray-400 mb-2">One email address per line.</p>
              <textarea
                value={studentEmails}
                onChange={e => setStudentEmails(e.target.value)}
                rows={8}
                placeholder="student@example.com&#10;another@example.com"
                className="border border-black p-3 w-full text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-y"
              />
            </div>
            <div>
              <label className="text-xs font-bold tracking-widest uppercase block mb-1">
                Tutor Emails
              </label>
              <p className="text-xs text-gray-400 mb-2">One email address per line.</p>
              <textarea
                value={tutorEmails}
                onChange={e => setTutorEmails(e.target.value)}
                rows={4}
                placeholder="tutor@example.com"
                className="border border-black p-3 w-full text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-y"
              />
            </div>
            {emailErr && <p className="text-red-600 text-sm">{emailErr}</p>}
            {emailSaved && <p className="text-green-600 text-xs font-bold tracking-widest uppercase">Saved.</p>}
            <button type="submit" disabled={savingEmails}
              className="bg-black text-white p-3 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50">
              {savingEmails ? 'Saving...' : 'Save Roster'}
            </button>
          </form>

          {/* Danger zone */}
          <div className="border border-black p-6 flex flex-col gap-4">
            <p className="text-xs font-bold tracking-widest uppercase text-black">Danger Zone</p>
            <div className="flex gap-4">
              <button onClick={handleDelete} disabled={deleting}
                className="text-xs font-bold tracking-widest uppercase border border-red-600 text-red-600 px-4 py-2 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50">
                {deleting ? 'Deleting...' : 'Delete Course'}
              </button>
            </div>
            <p className="text-xs text-gray-400">Permanently removes all course data including assignments, files, and submissions.</p>
          </div>
        </main>
      </div>
    )
  }

  // Course list view
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/admin" name={profile?.name} />
      <main className="p-8">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-xs font-bold tracking-widest uppercase text-black">People</h1>
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black/80 hover:text-white transition-colors duration-300">
            {showForm ? 'Cancel' : '+ New Course'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateCourse} className="border border-black p-6 mb-8 flex flex-col gap-4">
            <input type="text" placeholder="Course title" value={newTitle}
              onChange={e => setNewTitle(e.target.value)} required
              className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
            <textarea placeholder="Description (optional)" value={newDesc}
              onChange={e => setNewDesc(e.target.value)} rows={3}
              className="border border-black p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none" />
            {createErr && <p className="text-red-600 text-sm">{createErr}</p>}
            <button type="submit" disabled={creating}
              className="bg-black text-white p-3 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50">
              {creating ? 'Creating...' : 'Create Course'}
            </button>
          </form>
        )}

        {courses.length === 0 ? (
          <p className="text-xs font-bold tracking-widest uppercase text-black">No courses yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black border border-black">
            {courses.map(course => (
              <button key={course.id} onClick={() => openCourse(course)}
                className="bg-gray-100 p-6 flex flex-col gap-2 hover:bg-black/80 hover:text-white transition-colors duration-300 group text-left">
                <h3 className="text-base font-black text-black group-hover:text-white tracking-tight uppercase">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-xs text-gray-500 group-hover:text-gray-300">{course.description}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
