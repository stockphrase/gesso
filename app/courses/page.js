'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import { setActiveCourse, clearActiveCourse } from '@/utils/course'

export default function CoursesPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    clearActiveCourse()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (!prof) { router.push('/login'); return }
      setProfile(prof)

      // Get all course memberships with course details
      const { data: memberships } = await supabase
        .from('course_memberships')
        .select('course_id, role, courses(*)')
        .eq('user_id', user.id)

      setCourses(memberships?.map(m => ({ ...m.courses, memberRole: m.role })).filter(Boolean) || [])
      setLoading(false)
    }
    load()
  }, [])

function enterCourse(course) {
  setActiveCourse(course.id, course.title)
  router.push('/dashboard')
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
        <div className="mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Welcome</p>
          <h2 className="text-3xl font-black text-black tracking-tight">YOUR COURSES</h2>
        </div>

        {courses.length === 0 ? (
          <p className="text-xs font-bold tracking-widest uppercase text-black">
            You are not enrolled in any courses.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black border border-black">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => enterCourse(course)}
                className="bg-white p-6 flex flex-col gap-2 hover:bg-black hover:text-white transition-colors group text-left"
              >
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
