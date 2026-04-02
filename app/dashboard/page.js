'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import { getActiveCourse, clearActiveCourse } from '@/utils/course'

const tiles = [
  { title: 'SYLLABUS',      description: 'Course syllabus and schedule',       href: '/dashboard/syllabus'      },
  { title: 'ASSIGNMENTS',   description: 'Submit and track your work',          href: '/dashboard/assignments'   },
  { title: 'FILES',         description: 'Course readings and materials',       href: '/dashboard/files'         },
  { title: 'CONTACT',       description: 'Instructor contact and office hours', href: '/dashboard/contact'       },
]

const studentTiles = [
  { title: 'ANNOUNCEMENTS', description: 'Updates from your instructor',        href: '/dashboard/announcements' },
]

const tutorTiles = [
  { title: 'ANNOUNCEMENTS', description: 'Post and view announcements',         href: '/admin/announcements'     },
]

const adminTiles = [
  { title: 'ADMIN',         description: 'Edit and manage courses',             href: '/admin'                   },
]

export default function DashboardPage() {
  const [profile,    setProfile]    = useState(null)
  const [courseName, setCourseName] = useState('')
  const [loading,    setLoading]    = useState(true)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const course = getActiveCourse()
    if (!course) { router.push('/courses'); return }
    setCourseName(course.name)

    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    getProfile()
  }, [])

  async function handleSignOut() {
    clearActiveCourse()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function handleSwitchCourse() {
    clearActiveCourse()
    router.push('/courses')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    )
  }

  const visibleTiles = profile?.role === 'admin'
    ? [...tiles, ...studentTiles, ...adminTiles]
    : profile?.role === 'tutor'
    ? [...tiles, ...tutorTiles]
    : [...tiles, ...studentTiles]

  return (
    <main className="min-h-screen bg-white">
      <header className="border-b border-black px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{profile?.name}</span>
          <button onClick={handleSwitchCourse}
            className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
            Switch Course
          </button>
          <button onClick={handleSignOut}
            className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
            SIGN OUT
          </button>
        </div>
      </header>
      <div className="px-8 py-10 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Course</p>
        <h2 className="text-3xl font-black text-black tracking-tight">{courseName}</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black m-8">
        {visibleTiles.map((tile) => (
          <a
            key={tile.title}
            href={tile.href}
            className={`p-4 flex flex-col gap-1 hover:bg-black/80 hover:text-white transition-colors duration-300 group ${
              tile.title === 'ADMIN' ? 'bg-red-600' : 'bg-white'
            }`}
          >
            <h3 className={`text-base font-black tracking-tight uppercase group-hover:text-white ${
              tile.title === 'ADMIN' ? 'text-white' : 'text-black'
            }`}>
              {tile.title}
            </h3>
            <p className={`text-xs group-hover:text-gray-300 ${
              tile.title === 'ADMIN' ? 'text-red-200' : 'text-gray-500'
            }`}>
              {tile.description}
            </p>
          </a>
        ))}
      </div>
    </main>
  )
}
