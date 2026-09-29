import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const maxDocumentBytes = 10 * 1024 * 1024
const allowedTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

function getStorageClient() {
  const endpoint = process.env.SUPABASE_STORAGE_S3_ENDPOINT
  const region = process.env.SUPABASE_STORAGE_S3_REGION
  const accessKeyId = process.env.SUPABASE_STORAGE_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY
  if (!endpoint || !region || !accessKeyId || !secretAccessKey) return null
  return new S3Client({ credentials: { accessKeyId, secretAccessKey }, endpoint, forcePathStyle: true, region })
}

async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get('authorization')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!authorization || !url || !key) return null
  const client = createClient(url, key, { global: { headers: { Authorization: authorization } } })
  const { data: { user } } = await client.auth.getUser()
  return user
}

function extension(file: File) {
  const result = file.name.split('.').pop()?.toLowerCase()
  return result && /^(pdf|doc|docx)$/.test(result) ? result : 'bin'
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request)
  const storage = getStorageClient()
  const bucket = process.env.SUPABASE_STORAGE_S3_BUCKET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!user) return NextResponse.json({ error: 'Sesi pengguna tidak valid.' }, { status: 401 })
  if (!storage || !bucket || !supabaseUrl) return NextResponse.json({ error: 'Konfigurasi Storage belum lengkap.' }, { status: 500 })

  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !allowedTypes.has(file.type)) return NextResponse.json({ error: 'Gunakan file PDF, DOC, atau DOCX.' }, { status: 400 })
  if (file.size > maxDocumentBytes) return NextResponse.json({ error: 'Ukuran file maksimal 10 MB.' }, { status: 400 })

  const path = `${user.id}/perangkat/${crypto.randomUUID()}.${extension(file)}`
  await storage.send(new PutObjectCommand({ Body: Buffer.from(await file.arrayBuffer()), Bucket: bucket, ContentType: file.type, Key: path }))
  const url = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`
  return NextResponse.json({ path, url })
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request)
  const storage = getStorageClient()
  const bucket = process.env.SUPABASE_STORAGE_S3_BUCKET
  if (!user) return NextResponse.json({ error: 'Sesi pengguna tidak valid.' }, { status: 401 })
  if (!storage || !bucket) return NextResponse.json({ error: 'Konfigurasi Storage belum lengkap.' }, { status: 500 })
  const { path } = await request.json() as { path?: string }
  if (!path?.startsWith(`${user.id}/perangkat/`)) return NextResponse.json({ error: 'File tidak valid.' }, { status: 400 })
  await storage.send(new DeleteObjectCommand({ Bucket: bucket, Key: path }))
  return NextResponse.json({ ok: true })
}
