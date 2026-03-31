import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request) {
  const cookieStore = await cookies()
  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submission_id')

  if (!submissionId) {
    return Response.json({ error: 'Missing submission_id' }, { status: 400 })
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch submission — students can only download their own returned work
  const { data: submission, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .eq('user_id', user.id)
    .not('returned_storage_path', 'is', null)
    .single()

  if (error || !submission) {
    return Response.json({ error: 'Submission not found or not yet returned' }, { status: 404 })
  }

  const { data: signedUrl, error: urlError } = await supabase.storage
    .from('course-files')
    .createSignedUrl(submission.returned_storage_path, 60)

  if (urlError) {
    return Response.json({ error: 'Could not generate download link' }, { status: 500 })
  }

  return Response.json({
    url:      signedUrl.signedUrl,
    filename: submission.returned_filename,
  })
}
