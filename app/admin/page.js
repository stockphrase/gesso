'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSkull } from '@fortawesome/free-solid-svg-icons'

const adminTiles = [
  { title: 'ANNOUNCEMENTS', description: 'Post and manage announcements', href: '/admin/announcements' },
  { title: 'PEOPLE',        description: 'Manage course roster',          href: '/admin/people'        },
  { title: 'ASSIGNMENTS',   description: 'Manage assignments and grades',  href: '/admin/assignments'   },
  { title: 'SYLLABUS',      description: 'Edit the course syllabus',       href: '/admin/syllabus'      },
  { title: 'CONTACT',       description: 'Edit contact information',       href: '/admin/contact'       },
  { title: 'FILES',         description: 'Upload and manage course files', href: '/admin/files'         },
]

export default function AdminPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router   = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(profile)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/dashboard" name={profile?.name} />
      <div className="px-8 py-10 border-b border-gray-300">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Admin</p>
        <h2 className="text-3xl font-black text-black tracking-tight">ADMIN PANEL</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-black m-8">
        {adminTiles.map((tile) => (
          <a key={tile.title} href={tile.href}
            className="bg-gray-100 p-4 flex flex-col gap-1 hover:bg-black/80 hover:text-white transition-colors duration-300 group">
            <h3 className="text-base font-black text-black group-hover:text-white tracking-tight uppercase">
              {tile.title}
            </h3>
            <p className="text-xs text-gray-500 group-hover:text-gray-300">{tile.description}</p>
          </a>
        ))}
        <a href="/admin/delete-course"
          className="bg-gray-100 p-4 flex flex-col gap-1 hover:bg-red-600 hover:text-white transition-colors duration-300 group">
          <h3 className="text-base font-black text-red-600 group-hover:text-white tracking-tight uppercase flex items-center gap-2">
            <FontAwesomeIcon icon={faSkull} className="w-4 h-4" />
            Delete Course
          </h3>
          <p className="text-xs text-gray-500 group-hover:text-gray-300">Permanently remove this course</p>
        </a>
      </div>
    </main>
  )
}
