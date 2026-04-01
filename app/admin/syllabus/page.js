'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import AdminHeader from '@/components/AdminHeader'
import { marked } from 'marked'

import { getActiveCourse } from '@/utils/course'

const TEMPLATE = `# Course Title

## Course Description
Write a brief description of the course here.

## Required Texts
- Author, *Title of Book* (Publisher, Year)
- Author, *Title of Book* (Publisher, Year)

## Schedule
| Week | Topic | Reading |
|------|-------|---------|
| 1 | Introduction | Chapter 1 |
| 2 | Topic Two | Chapter 2 |

## Policies
Write your course policies here.

---

## Markdown Reference
Use this as a guide while editing, then delete it before saving.

**Bold text** — wrap in \`**double asterisks**\`
*Italic text* — wrap in \`*single asterisks*\`
[Link text](https://example.com) — \`[Link text](url)\`
# Heading 1 — \`# Heading 1\`
## Heading 2 — \`## Heading 2\`
### Heading 3 — \`### Heading 3\`
- Bullet list item — \`- item\`
1. Numbered list item — \`1. item\`
| Column 1 | Column 2 | — table (see schedule above for example)
\`---\` — horizontal rule divider
`

export default function AdminSyllabusPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,  setProfile]  = useState(null)
  const [courseId, setCourseId] = useState(null)
  const [content,  setContent]  = useState('')
  const [editing,  setEditing]  = useState(false)
  const [exists,   setExists]   = useState(false)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [error,    setError]    = useState(null)

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

      const { data: syllabus } = await supabase
        .from('syllabi')
        .select('content')
        .eq('course_id', course.id)
        .maybeSingle()

      if (syllabus) {
        setContent(syllabus.content)
        setExists(true)
        setEditing(false)
      } else {
        setContent(TEMPLATE)
        setEditing(true)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaving(true)
    setError(null)

    const { error: upsertError } = await supabase
      .from('syllabi')
      .upsert({
        course_id:  courseId,
        content,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'course_id' })

    if (upsertError) {
      setError(upsertError.message)
      setSaving(false)
      return
    }

    setExists(true)
    setEditing(false)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-black font-bold tracking-widest uppercase">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50">
      <AdminHeader backHref="/admin" name={profile?.name} />
      <main className="p-8 max-w-3xl">
        <div className="flex items-baseline justify-between mb-8">
          <h1 className="text-xs font-bold tracking-widest uppercase text-black">
            Syllabus
          </h1>

          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-4">
            {exists && (
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase">
                A syllabus already exists. Saving will overwrite it.
              </p>
            )}
            {/* Markdown reference */}
            <div className="border border-black">
              <button
                type="button"
                onClick={() => setShowRef(!showRef)}
                className="w-full px-4 py-2 text-xs font-bold tracking-widest uppercase text-left hover:bg-black hover:text-white transition-colors"
              >
                {showRef ? '▲' : '▼'} Markdown Reference
              </button>
              {showRef && (
                <table className="w-full text-xs border-t border-black">
                  <thead>
                    <tr className="border-b border-black">
                      <th className="text-left p-3 border-r border-black font-bold tracking-widest uppercase w-1/2">You type</th>
                      <th className="text-left p-3 font-bold tracking-widest uppercase w-1/2">You get</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50">**bold**</td>
                      <td className="p-3 font-bold">bold</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50">*italic*</td>
                      <td className="p-3 italic">italic</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50"># Heading 1</td>
                      <td className="p-3 text-xl font-black">Heading 1</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50">## Heading 2</td>
                      <td className="p-3 text-lg font-bold">Heading 2</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50">### Heading 3</td>
                      <td className="p-3 text-base font-bold">Heading 3</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50">[Link](https://...)</td>
                      <td className="p-3 underline">Link</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50">- item</td>
                      <td className="p-3">• item</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-3 border-r border-black font-mono bg-gray-50">1. item</td>
                      <td className="p-3">1. item</td>
                    </tr>
                    <tr>
                      <td className="p-3 border-r border-black font-mono bg-gray-50">---</td>
                      <td className="p-3"><hr className="border-black w-16" /></td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={24}
              placeholder="Write your syllabus in Markdown..."
              className="border border-black p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-y w-full"
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              {exists && (
                <button
                  onClick={() => setEditing(false)}
                  className="border border-black px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-black hover:text-white transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: marked(content) }}
          />
        )}
      </main>
    </div>
  )
}
