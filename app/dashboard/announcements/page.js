'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase'

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([])
  const [expanded, setExpanded]           = useState(null)
  const [loading, setLoading]             = useState(true)
  const supabase                          = createClient()

  useEffect(() => {
    async function getAnnouncements() {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false })

      setAnnouncements(data || [])
      setLoading(false)
    }

    getAnnouncements()
  }, [])

  function toggleExpanded(id) {
    setExpanded(expanded === id ? null : id)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold">LOADING...</p>
      </main>
    )
  }

function linkify(text) {
  const urlPattern = /(https?:\/\/[^\s]+)/g
  return text.split(urlPattern).map((part, i) =>
    urlPattern.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-bold hover:text-gray-500"
      >
        {part}
      </a>
    ) : (
      part
    )
  )
}
  return (
    <main className="min-h-screen bg-white">

      {/* Header */}
      <header className="border-b border-black px-8 py-6 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight text-black">GESSO</h1>
        <a
          href="/dashboard"
          className="text-sm font-bold text-black border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
        >
          BACK
        </a>
      </header>

      {/* Title */}
      <div className="px-8 py-10 border-b border-gray-200">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Course</p>
        <h2 className="text-3xl font-black text-black tracking-tight">
          ANNOUNCEMENTS
        </h2>
      </div>

      {/* Announcements list */}
      <div className="px-8 py-8">
        {announcements.length === 0 ? (
          <p className="text-gray-400 text-sm">No announcements yet.</p>
        ) : (
          <div className="flex flex-col divide-y divide-gray-200">
            {announcements.map((a) => (
              <div key={a.id}>
                {/* Row */}
                <button
                  onClick={() => toggleExpanded(a.id)}
                  className="w-full flex items-center justify-between py-5 text-left hover:bg-gray-50 transition-colors px-2 group"
                >
                  <div className="flex items-center gap-8">
                    <span className="text-xs font-mono text-gray-400 w-20 shrink-0">
                      {a.date}
                    </span>
                    <span className="text-sm font-bold text-black group-hover:underline">
                      {a.title}
                    </span>
                  </div>
                  <span className="text-gray-400 text-sm ml-4">
                    {expanded === a.id ? '−' : '+'}
                  </span>
                </button>

                {/* Expanded body */}
                {expanded === a.id && (
                  <div className="px-2 pb-6 ml-28">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {linkify(a.body)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  )
}
