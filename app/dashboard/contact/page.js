'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import Header from '@/components/Header'
import { getActiveCourse } from '@/utils/course'

function ObfuscatedEmail({ email }) {
  const [revealed, setRevealed] = useState(false)
  const parts = email.split('@')

  function handleClick(e) {
    e.preventDefault()
    window.location.href = `mailto:${parts[0]}@${parts[1]}`
  }

  return (
    <a href="#" onClick={handleClick}
      onMouseEnter={() => setRevealed(true)}
      onMouseLeave={() => setRevealed(false)}
      className="text-base font-black text-black tracking-tight hover:underline">
      {revealed ? email : `${parts[0]}[at]${parts[1]}`}
    </a>
  )
}

export default function StudentContactPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState(null)
  const [contact, setContact] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const course = getActiveCourse()
    if (!course) { router.push('/courses'); return }

    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (!prof || prof.role !== 'student') { router.push('/dashboard'); return }
      setProfile(prof)

      const { data } = await supabase
        .from('contact_info')
        .select('*')
        .eq('course_id', course.id)
        .maybeSingle()

      setContact(data || null)
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
      <main className="p-8 max-w-xl">
        <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-8">Contact</h1>
        {!contact ? (
          <p className="text-xs font-bold tracking-widest uppercase text-black">No contact info posted yet.</p>
        ) : (
          <div className="flex flex-col gap-px bg-black border border-black">
            {contact.professor_name && (
              <div className="bg-white p-5 flex flex-col gap-1">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Professor</p>
                <p className="text-base font-black text-black tracking-tight">{contact.professor_name}</p>
              </div>
            )}
            {contact.email && (
              <div className="bg-white p-5 flex flex-col gap-1">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Email</p>
                <ObfuscatedEmail email={contact.email} />
              </div>
            )}
            {contact.phone && (
              <div className="bg-white p-5 flex flex-col gap-1">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Phone</p>
                <a href={`tel:${contact.phone}`}
                  className="text-base font-black text-black tracking-tight hover:underline">
                  {contact.phone}
                </a>
              </div>
            )}
            {contact.office_location && (
              <div className="bg-white p-5 flex flex-col gap-1">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Office</p>
                <p className="text-base font-black text-black tracking-tight">{contact.office_location}</p>
              </div>
            )}
            {contact.office_hours && (
              <div className="bg-white p-5 flex flex-col gap-1">
                <p className="text-xs text-gray-400 uppercase tracking-widest">Office Hours</p>
                <p className="text-sm text-black whitespace-pre-line">{contact.office_hours}</p>
              </div>
            )}
            {contact.links && contact.links.length > 0 && (
              <div className="bg-white p-5 flex flex-col gap-2">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Links</p>
                {contact.links.map((link, i) => (
                  link.label && link.url ? (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                      className="text-base font-black text-black tracking-tight hover:underline">
                      {link.label} →
                    </a>
                  ) : null
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
