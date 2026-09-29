import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const maxImageBytes = 2 * 1024 * 1024

function getStorageClient() {
  const endpoint = process.env.SUPABASE_STORAGE_S3_ENDPOINT
  const region = process.env.SUPABASE_STORAGE_S3_REGION
  const accessKeyId = process.env.SUPABASE_STORAGE_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY

  if (!endpoint || !region || !accessKeyId || !secretAccessKey) return null

  return new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint,
    forcePathStyle: true,
    region,
  })
}

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!authorization || !supabaseUrl || !supabaseAnonKey) return null

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const {
    data: { user },
  } = await client.auth.getUser()

  return user
}

function fileExtension(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension && /^[a-z0-9]{1,10}$/.test(extension) ? extension : 'jpg'
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'Sesi pengguna tidak valid.' }, { status: 401 })

  const storage = getStorageClient()
  const bucket = process.env.SUPABASE_STORAGE_S3_BUCKET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!storage || !bucket || !supabaseUrl) {
    return NextResponse.json({ error: 'Konfigurasi Supabase Storage belum lengkap.' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'File harus berupa gambar.' }, { status: 400 })
  }
  if (file.size > maxImageBytes) {
    return NextResponse.json({ error: 'Ukuran gambar maksimal 2 MB.' }, { status: 400 })
  }

  const objectPath = `${user.id}/${crypto.randomUUID()}.${fileExtension(file)}`
  await storage.send(
    new PutObjectCommand({
      Body: Buffer.from(await file.arrayBuffer()),
      Bucket: bucket,
      ContentType: file.type,
      Key: objectPath,
    }),
  )

  const url = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

  return NextResponse.json({ path: objectPath, url })
}
