'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import AdminHeader from '@/components/AdminHeader'

import { getActiveCourse } from '@/utils/course'

export default function AdminContactPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,        setProfile]        = useState(null)
  const [courseId,       setCourseId]       = useState(null)
  const [professorName,  setProfessorName]  = useState('')
  const [email,          setEmail]          = useState('')
  const [officeLocation, setOfficeLocation] = useState('')
  const [officeHours,    setOfficeHours]    = useState('')
  const [phone,          setPhone]          = useState('')
  const [links,          setLinks]          = useState([])
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)
  const [saved,          setSaved]          = useState(false)
  const [error,          setError]          = useState(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: prof } = await supabase
        .from('profiles').select('*').eq('id', user.id).single()

      if (prof?.role !== 'admin') { router.push('/dashboard'); return }
      setProfile(prof)

      const course = getActiveCourse()
      if (!course) { router.push('/courses'); return }
      setCourseId(course.id)

      const { data: contact } = await supabase
        .from('contact_info')
        .select('*')
        .eq('course_id', course.id)
        .maybeSingle()

      if (contact) {
        setProfessorName(contact.professor_name || '')
        setEmail(contact.email || '')
        setOfficeLocation(contact.office_location || '')
        setOfficeHours(contact.office_hours || '')
        setPhone(contact.phone || '')
        setLinks(contact.links || [])
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)

    const { error: upsertError } = await supabase
      .from('contact_info')
      .upsert({
        course_id:       courseId,
        professor_name:  professorName,
        email,
        office_location: officeLocation,
        office_hours:    officeHours,
        phone,
        links,
      }, { onConflict: 'course_id' })

    if (upsertError) {
      setError(upsertError.message)
    } else {
      setSaved(true)
    }
    setSaving(false)
  }

  function addLink() {
    setLinks([...links, { label: '', url: '' }])
  }

  function updateLink(i, field, val) {
    const l = [...links]
    l[i] = { ...l[i], [field]: val }
    setLinks(l)
  }

  function removeLink(i) {
    setLinks(links.filter((_, idx) => idx !== i))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader backHref="/admin" name={profile?.name} />
      <main className="p-8 max-w-xl">
        <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-8">Contact Info</h1>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Professor Name</label>
            <input type="text" value={professorName} onChange={e => setProfessorName(e.target.value)}
              className="border border-black p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="border border-black p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Office Location</label>
            <input type="text" value={officeLocation} onChange={e => setOfficeLocation(e.target.value)}
              className="border border-black p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="border border-black p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black" />
          </div>
          <div>
            <label className="text-xs text-gray-400 uppercase tracking-widest block mb-1">Office Hours</label>
            <textarea value={officeHours} onChange={e => setOfficeHours(e.target.value)} rows={4}
              placeholder="e.g. Monday 2–4pm, Wednesday 10am–12pm"
              className="border border-black p-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-black resize-y" />
          </div>

          {/* Links */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Links</p>
            <div className="flex flex-col gap-2">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="text" placeholder="Label" value={link.label}
                    onChange={e => updateLink(i, 'label', e.target.value)}
                    className="border border-black p-2 text-sm w-1/3 focus:outline-none focus:ring-2 focus:ring-black" />
                  <input type="url" placeholder="https://..." value={link.url}
                    onChange={e => updateLink(i, 'url', e.target.value)}
                    className="border border-black p-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-black" />
                  <button type="button" onClick={() => removeLink(i)}
                    className="text-xs font-bold tracking-widest uppercase border border-black px-3 py-2 hover:bg-black hover:text-white transition-colors shrink-0">
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addLink}
              className="mt-3 text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors">
              + Add Link
            </button>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {saved && <p className="text-green-600 text-xs font-bold tracking-widest uppercase">Saved.</p>}
          <button type="submit" disabled={saving}
            className="bg-black text-white p-3 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </main>
    </div>
  )
}
