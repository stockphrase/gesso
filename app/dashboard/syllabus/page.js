'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import Header from '@/components/Header'
import { marked } from 'marked'

export default function StudentSyllabusPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)

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

      const { data: syllabus } = await supabase
        .from('syllabi')
        .select('content')
        .eq('course_id', membership.course_id)
        .single()

      setContent(syllabus?.content || null)
      setLoading(false)
    }
    load()
  }, [])

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
      <main className="p-8 max-w-3xl">
        <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-8">
          Syllabus
        </h1>
        {content ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: marked(content) }}
          />
        ) : (
          <p className="text-xs font-bold tracking-widest uppercase text-black">
            No syllabus posted yet.
          </p>
        )}
      </main>
    </div>
  )
}
