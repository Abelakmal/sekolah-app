import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '../../../core/supabase/server'

type DevicePayload = {
  file_name?: string
  file_path?: string
  file_size?: number
  file_type?: string
  file_url?: string
  id?: string
  topic?: string
}

async function getTeacherId(request: Request) {
  const authorization = request.headers.get('authorization')
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!authorization || !url || !key) return null

  const userClient = createClient(url, key, { global: { headers: { Authorization: authorization } } })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return null

  const admin = createSupabaseAdminClient()
  const { data: profile } = await admin.from('profiles').select('teacher_id').eq('id', user.id).maybeSingle<{ teacher_id: string | null }>()
  return profile?.teacher_id ?? null
}

function invalidPayload(payload: DevicePayload, includeFile: boolean) {
  if (!payload.topic?.trim()) return true
  if (!includeFile) return false
  return !payload.file_name || !payload.file_path || !payload.file_url || !payload.file_type || !payload.file_size
}

export async function GET(request: Request) {
  const teacherId = await getTeacherId(request)
  if (!teacherId) return NextResponse.json({ error: 'Sesi guru tidak valid.' }, { status: 401 })
  const { data, error } = await createSupabaseAdminClient()
    .from('learning_devices')
    .select('id,teacher_id,topic,file_name,file_path,file_url,file_type,file_size,created_at,updated_at')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ devices: data ?? [] })
}

export async function POST(request: Request) {
  const teacherId = await getTeacherId(request)
  if (!teacherId) return NextResponse.json({ error: 'Sesi guru tidak valid.' }, { status: 401 })
  const payload = await request.json() as DevicePayload
  if (invalidPayload(payload, true)) return NextResponse.json({ error: 'Data perangkat belum lengkap.' }, { status: 400 })
  const { data, error } = await createSupabaseAdminClient().from('learning_devices').insert({
    teacher_id: teacherId,
    topic: payload.topic!.trim(),
    file_name: payload.file_name!,
    file_path: payload.file_path!,
    file_url: payload.file_url!,
    file_type: payload.file_type!,
    file_size: payload.file_size!,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ device: data })
}

export async function PATCH(request: Request) {
  const teacherId = await getTeacherId(request)
  if (!teacherId) return NextResponse.json({ error: 'Sesi guru tidak valid.' }, { status: 401 })
  const payload = await request.json() as DevicePayload
  if (!payload.id || invalidPayload(payload, false)) return NextResponse.json({ error: 'Data perangkat tidak valid.' }, { status: 400 })
  const values = {
    topic: payload.topic!.trim(),
    ...(payload.file_name ? { file_name: payload.file_name, file_path: payload.file_path, file_url: payload.file_url, file_type: payload.file_type, file_size: payload.file_size } : {}),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await createSupabaseAdminClient().from('learning_devices').update(values).eq('id', payload.id).eq('teacher_id', teacherId).select().maybeSingle()
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'Perangkat tidak ditemukan.' }, { status: 400 })
  return NextResponse.json({ device: data })
}

export async function DELETE(request: Request) {
  const teacherId = await getTeacherId(request)
  if (!teacherId) return NextResponse.json({ error: 'Sesi guru tidak valid.' }, { status: 401 })
  const { id } = await request.json() as DevicePayload
  if (!id) return NextResponse.json({ error: 'ID perangkat tidak valid.' }, { status: 400 })
  const { error } = await createSupabaseAdminClient().from('learning_devices').delete().eq('id', id).eq('teacher_id', teacherId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
