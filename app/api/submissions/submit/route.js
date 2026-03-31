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

  if (profile?.role !== 'student') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData     = await request.formData()
  const file         = formData.get('file')
  const assignmentId = formData.get('assignment_id')
  const draftStage   = formData.get('draft_stage')

  if (!file || !assignmentId || !draftStage) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const filename    = file.name
  const arrayBuffer = await file.arrayBuffer()
  const storagePath = `submissions/${assignmentId}/${user.id}/${draftStage}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from('course-files')
    .upload(storagePath, arrayBuffer, { upsert: true })

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 })
  }

  // Upsert submission record
  const { data: existing } = await supabase
    .from('submissions')
    .select('id')
    .eq('assignment_id', assignmentId)
    .eq('user_id', user.id)
    .eq('draft_stage', draftStage)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('submissions')
      .update({
        filename,
        storage_path: storagePath,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', existing.id)

    if (error) return Response.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase
      .from('submissions')
      .insert({
        assignment_id: assignmentId,
        user_id:       user.id,
        draft_stage:   draftStage,
        filename,
        storage_path:  storagePath,
        submitted_at:  new Date().toISOString(),
      })

    if (error) return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
