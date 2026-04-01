'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { setActiveCourse, clearActiveCourse } from '@/utils/course'

export default function CoursesPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,   setProfile]   = useState(null)
  const [courses,   setCourses]   = useState([])
  const [loading,   setLoading]   = useState(true)

  // New course form — admin only
  const [showForm,  setShowForm]  = useState(false)
  const [newTitle,  setNewTitle]  = useState('')
  const [newDesc,   setNewDesc]   = useState('')
  const [creating,  setCreating]  = useState(false)
  const [createErr, setCreateErr] = useState(null)

  useEffect(() => {
    clearActiveCourse()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (!prof) { router.push('/login'); return }
      setProfile(prof)

      await loadCourses(user.id)
      setLoading(false)
    }
    load()
  }, [])

  async function loadCourses(userId) {
    const { data: memberships } = await supabase
      .from('course_memberships')
      .select('course_id, role, courses(*)')
      .eq('user_id', userId)
    setCourses(
      memberships?.map(m => ({ ...m.courses, memberRole: m.role })).filter(Boolean) || []
    )
  }

function enterCourse(course) {
  setActiveCourse(course.id, course.title)
  if (profile?.role === 'admin') {
    router.push('/admin')
  } else {
    router.push('/dashboard')
  }
}

  async function handleCreateCourse(e) {
    e.preventDefault()
    setCreating(true)
    setCreateErr(null)

    const { data: { user } } = await supabase.auth.getUser()

    const { data: course, error } = await supabase
      .from('courses')
      .insert({ title: newTitle, description: newDesc, created_by: profile.id })
      .select()
      .single()

    if (error) { setCreateErr(error.message); setCreating(false); return }

    // Auto-enroll the admin in the new course
    await supabase.from('course_memberships').insert({
      course_id: course.id,
      user_id:   user.id,
      role:      'admin',
    })

    await loadCourses(user.id)
    setNewTitle('')
    setNewDesc('')
    setShowForm(false)
    setCreating(false)
  }

  async function handleSignOut() {
    clearActiveCourse()
    await supabase.auth.signOut()
    router.push('/login')
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
      <header className="border-b border-black px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
        <div className="flex items-center gap-8">
          {profile?.name && <span className="text-sm text-gray-600">{profile.name}</span>}
          <button onClick={handleSignOut}
            className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
            SIGN OUT
          </button>
        </div>
      </header>

      <main className="p-8">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Welcome</p>
            <h2 className="text-3xl font-black text-black tracking-tight">YOUR COURSES</h2>
          </div>
          {profile?.role === 'admin' && (
            <button onClick={() => setShowForm(!showForm)}
              className="text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-300">
              {showForm ? 'Cancel' : '+ New Course'}
            </button>
          )}
        </div>

        {/* New course form — admin only */}
        {showForm && (
          <form onSubmit={handleCreateCourse} className="border border-black p-6 mb-8 flex flex-col gap-4 max-w-lg">
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
          <p className="text-xs font-bold tracking-widest uppercase text-black">
            No courses yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black border border-black">
            {courses.map(course => (
              <button key={course.id} onClick={() => enterCourse(course)}
                className="bg-white p-6 flex flex-col gap-2 hover:bg-black/80 hover:text-white transition-colors duration-300 group text-left">
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
