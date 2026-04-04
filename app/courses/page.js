'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { setActiveCourse, clearActiveCourse } from '@/utils/course'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faGear } from '@fortawesome/free-solid-svg-icons'

function buildCourseDisplay(course, profileName) {
  const meta = course.meta || {}
  const lastName = profileName ? profileName.split(' ').pop() : ''
  if (meta.courseName && meta.section && meta.term && meta.year) {
    return `${lastName} | ${meta.courseName} | ${meta.section} | ${meta.term} | ${meta.year}`
  }
  return course.title // fallback for old courses
}

export default function CoursesPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,   setProfile]   = useState(null)
  const [courses,   setCourses]   = useState([])
  const [loading,   setLoading]   = useState(true)

  // New course form — admin only
  const [showForm,    setShowForm]    = useState(false)
  const [courseName,  setCourseName]  = useState('')
  const [section,     setSection]     = useState('')
  const [term,        setTerm]        = useState('Fall')
  const [year,        setYear]        = useState(new Date().getFullYear().toString())
  const [creating,    setCreating]    = useState(false)
  const [createErr,   setCreateErr]   = useState(null)

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
    const displayName = buildCourseDisplay(course, profile?.name)
    setActiveCourse(course.id, displayName)
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
    const lastName   = profile.name ? profile.name.split(' ').pop() : ''
    const displayTitle = `${lastName} | ${courseName} | ${section} | ${term} | ${year}`
    const meta = { courseName, section, term, year }

    const { data: course, error } = await supabase
      .from('courses')
      .insert({
        title:       displayTitle,
        description: '',
        created_by:  profile.id,
        meta,
      })
      .select()
      .single()

    if (error) { setCreateErr(error.message); setCreating(false); return }

    await supabase.from('course_memberships').insert({
      course_id: course.id,
      user_id:   user.id,
      role:      'admin',
    })

    await loadCourses(user.id)
    setCourseName('')
    setSection('')
    setTerm('Fall')
    setYear(new Date().getFullYear().toString())
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

        {showForm && (
          <form onSubmit={handleCreateCourse} className="border border-black p-6 mb-8 flex flex-col gap-4 max-w-lg">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Course Name</label>
              <input type="text" placeholder="e.g. Writing 2" value={courseName}
                onChange={e => setCourseName(e.target.value)} required
                className="border border-black p-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Section</label>
              <input type="text" placeholder="e.g. 04" value={section}
                onChange={e => setSection(e.target.value)} required
                className="border border-black p-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Term</label>
                <select value={term} onChange={e => setTerm(e.target.value)}
                  className="border border-black p-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black">
                  <option>Fall</option>
                  <option>Spring</option>
                  <option>Summer</option>
                  <option>Winter</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Year</label>
                <input type="number" value={year} onChange={e => setYear(e.target.value)} required
                  min="2020" max="2099"
                  className="border border-black p-3 text-sm w-full focus:outline-none focus:ring-2 focus:ring-black" />
              </div>
            </div>
            <div className="border border-gray-200 p-3 text-xs text-gray-400">
              Preview: <span className="font-black text-black">
                {profile?.name?.split(' ').pop() || 'LastName'} | {courseName || 'Course Name'} | {section || '00'} | {term} | {year}
              </span>
            </div>
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
              <div key={course.id} className="relative group">
                <button onClick={() => enterCourse(course)}
                  className="w-full bg-white p-6 flex flex-col gap-2 hover:bg-black/80 hover:text-white transition-colors duration-300 text-left">
                  <h3 className="text-sm font-black text-black group-hover:text-white tracking-tight uppercase">
                    {buildCourseDisplay(course, profile?.name)}
                  </h3>
                </button>
                {profile?.role === 'admin' && (
                  <a href={`/admin/course-settings/${course.id}`}
                    onClick={e => e.stopPropagation()}
                    className="absolute top-2 right-2 text-gray-400 hover:text-black p-1 transition-colors">
                    <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
