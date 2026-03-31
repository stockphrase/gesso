'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase'
import Header from '@/components/Header'

export default function FilesPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [profile,       setProfile]       = useState(null)
  const [folders,       setFolders]       = useState([])
  const [activeFolder,  setActiveFolder]  = useState(null)
  const [files,         setFiles]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [loadingFiles,  setLoadingFiles]  = useState(false)
  const [downloading,   setDownloading]   = useState(null)

  useEffect(() => {
    async function init() {
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

      const { data: folderData } = await supabase
        .from('file_folders')
        .select('*')
        .eq('course_id', membership.course_id)
        .eq('permission_level', 1)
        .order('name')

      setFolders(folderData || [])
      setLoading(false)
    }
    init()
  }, [])

  async function openFolder(folder) {
    setActiveFolder(folder)
    setLoadingFiles(true)
    setFiles([])

    const { data } = await supabase
      .from('files').select('*').eq('folder_id', folder.id).order('name')

    setFiles(data || [])
    setLoadingFiles(false)
  }

  function backToFolders() {
    setActiveFolder(null)
    setFiles([])
  }

  async function downloadFile(file) {
    setDownloading(file.id)
    try {
      const res  = await fetch(`/api/files/download?file_id=${file.id}`)
      const data = await res.json()
      if (data.url) {
        const blob    = await fetch(data.url).then(r => r.blob())
        const blobUrl = URL.createObjectURL(blob)
        const a       = document.createElement('a')
        a.href        = blobUrl
        a.download    = data.filename
        a.click()
        URL.revokeObjectURL(blobUrl)
      }
    } finally {
      setDownloading(null)
    }
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
      <Header
        backHref={activeFolder ? null : '/dashboard'}
        onBack={activeFolder ? backToFolders : null}
        name={profile?.name}
      />
      <main className="p-8">
        {!activeFolder && (
          <>
            <h1 className="text-xs font-bold tracking-widest uppercase text-black mb-8">Files</h1>
            {folders.length === 0 ? (
              <p className="text-xs font-bold tracking-widest uppercase text-black">No files available.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => openFolder(folder)}
                    className="border border-black p-6 text-left hover:bg-black hover:text-white transition-colors group"
                  >
                    <svg viewBox="0 0 24 24" className="w-8 h-8 mb-3 fill-none stroke-black group-hover:stroke-white transition-colors" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
                    </svg>
                    <p className="text-xs font-bold tracking-widest uppercase">{folder.name}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeFolder && (
          <>
            <div className="flex items-baseline gap-6 mb-8">
              <button onClick={backToFolders}
                className="text-xs font-bold tracking-widest uppercase text-black underline">
                ← Back
              </button>
              <h1 className="text-xs font-bold tracking-widest uppercase text-black">
                {activeFolder.name}
              </h1>
            </div>
            {loadingFiles ? (
              <p className="text-xs font-bold tracking-widest uppercase text-black">Loading...</p>
            ) : files.length === 0 ? (
              <p className="text-xs font-bold tracking-widest uppercase text-black">No files in this folder.</p>
            ) : (
              <div className="border-t border-black">
                {files.map(file => (
                  <div key={file.id} className="border-b border-black flex items-center gap-6 py-4 px-2">
                    <button
                      onClick={() => downloadFile(file)}
                      disabled={downloading === file.id}
                      className="text-xs font-bold tracking-widest uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors disabled:opacity-40 shrink-0"
                    >
                      {downloading === file.id ? 'Downloading...' : 'Download'}
                    </button>
                    <p className="text-xs font-bold tracking-widest uppercase text-black">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}