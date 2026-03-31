import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request) {
  const cookieStore = await cookies()

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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData       = await request.formData()
  const file           = formData.get('file')
  const submissionId   = formData.get('submission_id')

  if (!file || !submissionId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get the submission to build storage path
  const { data: submission, error: fetchError } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', submissionId)
    .single()

  if (fetchError || !submission) {
    return Response.json({ error: 'Submission not found' }, { status: 404 })
  }

  const filename    = file.name
  const arrayBuffer = await file.arrayBuffer()
  const storagePath = `returns/${submission.assignment_id}/${submission.user_id}/${submission.draft_stage}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('course-files')
    .upload(storagePath, arrayBuffer, { upsert: true })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  const { error: updateError } = await supabase
    .from('submissions')
    .update({
      returned_filename:     filename,
      returned_storage_path: storagePath,
      returned_at:           new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
