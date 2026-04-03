import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import JSZip from 'jszip'

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

  // Check admin
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


  // Parse form data
  const formData        = await request.formData()
  const file            = formData.get('file')
  const courseId        = formData.get('course_id')
  const permissionLevel = parseInt(formData.get('permission_level'))

  if (!file || !courseId || !permissionLevel) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }
  
  if (file.size > 40 * 1024 * 1024) {
  return Response.json({ error: 'ZIP file too large. Maximum size is 40MB.' }, { status: 400 })
}

  // Read zip
  const arrayBuffer = await file.arrayBuffer()
  const zip         = await JSZip.loadAsync(arrayBuffer)

  const results = {
    folders_created: 0,
    files_uploaded:  0,
    errors:          [],
  }

  // Group files by their top-level folder
  const folderMap = {}

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return
    if (relativePath.startsWith('__MACOSX')) return
    if (relativePath.startsWith('.')) return

    const parts      = relativePath.split('/')
    const folderName = parts.length > 1 ? parts[0] : 'Uncategorized'
    const fileName   = parts[parts.length - 1]

    if (!fileName || fileName.startsWith('.')) return

    if (!folderMap[folderName]) {
      folderMap[folderName] = []
    }

    folderMap[folderName].push({ zipEntry, fileName, relativePath })
  })

  // Process each folder
  for (const [folderName, files] of Object.entries(folderMap)) {
    // Check if folder already exists
    let { data: existingFolder } = await supabase
      .from('file_folders')
      .select('id')
      .eq('course_id', courseId)
      .eq('name', folderName)
      .single()

    let folderId

    if (existingFolder) {
      folderId = existingFolder.id
    } else {
      const { data: newFolder, error: folderError } = await supabase
        .from('file_folders')
        .insert({
          course_id:        courseId,
          name:             folderName,
          permission_level: permissionLevel,
          created_by:       user.id,
        })
        .select('id')
        .single()

      if (folderError) {
        results.errors.push(`Failed to create folder ${folderName}: ${folderError.message}`)
        continue
      }

      folderId = newFolder.id
      results.folders_created++
    }

    // Upload each file in the folder
    for (const { zipEntry, fileName } of files) {
      try {
        const fileData    = await zipEntry.async('arraybuffer')
        const storagePath = `${courseId}/${folderId}/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('course-files')
          .upload(storagePath, fileData, { upsert: true })

        if (uploadError) {
          results.errors.push(`Failed to upload ${fileName}: ${uploadError.message}`)
          continue
        }

        // Check if file record already exists
        const { data: existingFile } = await supabase
          .from('files')
          .select('id')
          .eq('folder_id', folderId)
          .eq('name', fileName)
          .single()

        if (existingFile) {
          await supabase
            .from('files')
            .update({
              storage_path: storagePath,
              size:         fileData.byteLength,
            })
            .eq('id', existingFile.id)
        } else {
          // Insert new record with error checking
          const { error: insertError } = await supabase
            .from('files')
            .insert({
              folder_id:    folderId,
              name:         fileName,
              storage_path: storagePath,
              size:         fileData.byteLength,
              uploaded_by:  user.id,
            })

          if (insertError) {
            results.errors.push(`Failed to upload ${fileName}: ${insertError.message}`)
            continue
          }
        }

        results.files_uploaded++
      } catch (err) {
        results.errors.push(`Error processing ${fileName}: ${err.message}`)
      }
    }
  }

  return Response.json({ success: true, ...results })
}
