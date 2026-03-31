'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'
import { useRouter } from 'next/navigation'
import AdminHeader from '@/components/AdminHeader'

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [title, setTitle]                 = useState('')
  const [body, setBody]                   = useState('')
  const [date, setDate]                   = useState('')
  const [error, setError]                 = useState(null)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const router                            = useRouter()
  const supabase                          = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()

      if (profile?.role !== 'admin') { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false })

      setAnnouncements(data || [])

      const today = new Date()
      const yyyy  = today.getFullYear()
      const mm    = String(today.getMonth() + 1).padStart(2, '0')
      const dd    = String(today.getDate()).padStart(2, '0')
      setDate(`${yyyy}${mm}${dd}`)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('announcements')
      .insert({ title, body, date, created_by: user.id })

    if (error) { setError(error.message); setSaving(false); return }

    const { data } = await supabase
      .from('announcements').select('*').order('date', { ascending: false })

    setAnnouncements(data || [])
    setTitle('')
    setBody('')
    setSaving(false)
  }

  async function handleDelete(id) {
    await supabase.from('announcements').delete().eq('id', id)
    setAnnouncements(announcements.filter(a => a.id !== id))
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-red-50">
      <AdminHeader backHref="/admin" />
      <div className="px-8 py-10 border-b border-gray-300">
        <p className="text-xs text-red-400 uppercase tracking-widest mb-1">Admin</p>
        <h2 className="text-3xl font-black text-black tracking-tight">ANNOUNCEMENTS</h2>
      </div>
      <div className="px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-6">New Announcement</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Date (YYYYMMDD)</label>
              <input type="text" value={date} onChange={e => setDate(e.target.value)} required
                className="border border-black p-3 w-full text-black focus:outline-none focus:ring-2 focus:ring-black font-mono" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Title</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} required
                className="border border-black p-3 w-full text-black focus:outline-none focus:ring-2 focus:ring-black" />
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Body</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} required rows={6}
                className="border border-black p-3 w-full text-black focus:outline-none focus:ring-2 focus:ring-black resize-none" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={saving}
              className="bg-black text-white p-3 font-bold hover:bg-gray-800 transition-colors disabled:opacity-50">
              {saving ? 'POSTING...' : 'POST ANNOUNCEMENT'}
            </button>
          </form>
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest mb-6">Posted Announcements</h3>
          {announcements.length === 0 ? (
            <p className="text-gray-400 text-sm">No announcements yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {announcements.map((a) => (
                <div key={a.id} className="border border-red-200 bg-white p-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-gray-400 mb-1">{a.date}</p>
                    <p className="text-sm font-bold text-black">{a.title}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.body}</p>
                  </div>
                  <button onClick={() => handleDelete(a.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-bold shrink-0">
                    DELETE
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}