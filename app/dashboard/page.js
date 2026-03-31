'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'

const tiles = [
  { title: 'SYLLABUS',       description: 'Course syllabus and schedule',      href: '/dashboard/syllabus'      },
  { title: 'ASSIGNMENTS',    description: 'Submit and track your work',         href: '/dashboard/assignments'   },
  { title: 'ANNOUNCEMENTS',  description: 'Updates from your instructor',       href: '/dashboard/announcements' },
  { title: 'FILES',          description: 'Course readings and materials',       href: '/dashboard/files'         },
  { title: 'CONTACT',        description: 'Instructor contact and office hours',href: '/dashboard/contact'       },
]

const adminTiles = [
  { title: 'ADMIN',          description: 'Manage courses and students',        href: '/admin'                   },
]

export default function DashboardPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router                = useRouter()
  const supabase              = createClient()

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(data)
      setLoading(false)
    }

    getProfile()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    )
  }

  const visibleTiles = profile?.role === 'admin'
    ? [...tiles, ...adminTiles]
    : tiles

  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <header className="border-b border-black px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
        <div className="flex items-center gap-8">
          <span className="text-sm text-gray-600">{profile?.name}</span>
          <button
            onClick={handleSignOut}
            className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
          >
            SIGN OUT
          </button>
        </div>
      </header>

      {/* Course title placeholder */}
      <div className="px-8 py-10 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Course</p>
        <h2 className="text-3xl font-black text-black tracking-tight">
          WRITING 101
        </h2>
      </div>

      {/* Tile grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black m-8">
        {visibleTiles.map((tile) => (
          <a
            key={tile.title}
            href={tile.href}
            className="bg-white p-8 flex flex-col justify-between min-h-48 hover:bg-black hover:text-white transition-colors group"
          >
            <h3 className="text-xl font-black text-black group-hover:text-white tracking-tight">
              {tile.title}
            </h3>
            <p className="text-sm text-gray-500 group-hover:text-gray-300 mt-4">
              {tile.description}
            </p>
          </a>
        ))}
      </div>

    </main>
  )
}
