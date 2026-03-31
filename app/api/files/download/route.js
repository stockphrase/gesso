import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request) {
  const cookieStore = await cookies()
  const { searchParams } = new URL(request.url)
  const fileId = searchParams.get('file_id')

  if (!fileId) {
    return Response.json({ error: 'Missing file_id' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Get file and its folder (RLS enforces permission)
  const { data: file, error } = await supabase
    .from('files')
    .select('*, file_folders(*)')
    .eq('id', fileId)
    .single()

  if (error || !file) {
    return Response.json({ error: 'File not found or access denied' }, { status: 404 })
  }

  // Get signed URL (valid for 60 seconds)
  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('course-files')
    .createSignedUrl(file.storage_path, 60)

  if (urlError) {
    return Response.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return Response.json({ url: signedUrl.signedUrl, filename: file.name })
}
