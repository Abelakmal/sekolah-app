import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '../../../../core/supabase/server'
import type { Teacher } from '../../../../core/types'
import type { SupabaseProfile } from '../../../../core/supabase/types'

type CreateTeacherRequest = {
  classes: number[]
  email: string
  identityNumber: string
  identityType: Teacher['identityType']
  name: string
  password: string
}

type UpdateTeacherRequest = Omit<CreateTeacherRequest, 'password'> & { password?: string }

async function requireAdmin(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return { error: NextResponse.json({ error: 'Sesi admin tidak ditemukan.' }, { status: 401 }) }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return { error: NextResponse.json({ error: 'Konfigurasi Supabase public belum lengkap.' }, { status: 500 }) }
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()

  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Sesi admin tidak valid.' }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await userClient
    .from('profiles')
    .select('id,email,name,role,teacher_id')
    .eq('id', user.id)
    .maybeSingle<SupabaseProfile>()

  if (profileError || profile?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Hanya admin yang dapat mengelola user guru.' }, { status: 403 }) }
  }

  return { adminClient: createSupabaseAdminClient() }
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request)
  if ('error' in admin) return admin.error

  const { data: teachers, error } = await admin.adminClient
    .from('teachers')
    .select('id,profile_id,name,email,identity_type,identity_number,subject,classes')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ teachers })
}

export async function POST(request: Request) {
  const admin = await requireAdmin(request)
  if ('error' in admin) return admin.error

  const payload = (await request.json()) as Partial<CreateTeacherRequest>
  const name = payload.name?.trim()
  const email = payload.email?.trim().toLowerCase()
  const password = payload.password?.trim()
  const identityNumber = payload.identityNumber?.trim() ?? ''
  const identityType = payload.identityType
  const classes = payload.classes?.filter((grade) => Number.isInteger(grade) && grade >= 1 && grade <= 6) ?? []

  if (!name || !email || !password || !identityType || classes.length === 0) {
    return NextResponse.json({ error: 'Nama, email, password, identitas, dan kelas wajib diisi.' }, { status: 400 })
  }

  const { data: createdUser, error: createUserError } = await admin.adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: 'teacher',
    },
  })

  if (createUserError || !createdUser.user) {
    return NextResponse.json({ error: createUserError?.message ?? 'User guru gagal dibuat.' }, { status: 400 })
  }

  const authUserId = createdUser.user.id

  const { error: profileInsertError } = await admin.adminClient.from('profiles').insert({
    id: authUserId,
    email,
    name,
    role: 'teacher',
  })

  if (profileInsertError) {
    await admin.adminClient.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: profileInsertError.message }, { status: 400 })
  }

  const { data: teacher, error: teacherError } = await admin.adminClient
    .from('teachers')
    .insert({
      profile_id: authUserId,
      name,
      email,
      identity_type: identityType,
      identity_number: identityNumber,
      subject: 'PJOK',
      classes,
    })
    .select('id,profile_id,name,email,identity_type,identity_number,subject,classes')
    .single()

  if (teacherError || !teacher) {
    await admin.adminClient.from('profiles').delete().eq('id', authUserId)
    await admin.adminClient.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: teacherError?.message ?? 'Data guru gagal dibuat.' }, { status: 400 })
  }

  const { error: profileUpdateError } = await admin.adminClient
    .from('profiles')
    .update({ teacher_id: teacher.id, updated_at: new Date().toISOString() })
    .eq('id', authUserId)

  if (profileUpdateError) {
    await admin.adminClient.from('teachers').delete().eq('id', teacher.id)
    await admin.adminClient.from('profiles').delete().eq('id', authUserId)
    await admin.adminClient.auth.admin.deleteUser(authUserId)
    return NextResponse.json({ error: profileUpdateError.message }, { status: 400 })
  }

  return NextResponse.json({ teacher })
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request)
  if ('error' in admin) return admin.error

  const payload = (await request.json()) as Partial<UpdateTeacherRequest & { id: string }>
  const id = payload.id?.trim()
  const name = payload.name?.trim()
  const email = payload.email?.trim().toLowerCase()
  const identityNumber = payload.identityNumber?.trim() ?? ''
  const identityType = payload.identityType
  const password = payload.password?.trim()
  const classes = payload.classes?.filter((grade) => Number.isInteger(grade) && grade >= 1 && grade <= 6) ?? []

  if (!id || !name || !email || !identityType || classes.length === 0) {
    return NextResponse.json({ error: 'Data guru belum lengkap.' }, { status: 400 })
  }
  if (password && password.length < 6) {
    return NextResponse.json({ error: 'Password baru minimal 6 karakter.' }, { status: 400 })
  }

  const { data: currentTeacher, error: currentError } = await admin.adminClient
    .from('teachers')
    .select('id,profile_id')
    .eq('id', id)
    .maybeSingle<{ id: string; profile_id: string | null }>()

  if (currentError || !currentTeacher) {
    return NextResponse.json({ error: currentError?.message ?? 'Guru tidak ditemukan.' }, { status: 404 })
  }

  if (currentTeacher.profile_id) {
    const { error: authUpdateError } = await admin.adminClient.auth.admin.updateUserById(currentTeacher.profile_id, {
      email,
      user_metadata: { name, role: 'teacher' },
      ...(password ? { password } : {}),
    })

    if (authUpdateError) {
      return NextResponse.json({ error: authUpdateError.message }, { status: 400 })
    }
  }

  const { data: teacher, error: teacherError } = await admin.adminClient
    .from('teachers')
    .update({
      name,
      email,
      identity_type: identityType,
      identity_number: identityNumber,
      classes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id,profile_id,name,email,identity_type,identity_number,subject,classes')
    .single()

  if (teacherError || !teacher) {
    return NextResponse.json({ error: teacherError?.message ?? 'Data guru gagal diperbarui.' }, { status: 400 })
  }

  if (currentTeacher.profile_id) {
    await admin.adminClient
      .from('profiles')
      .update({ email, name, updated_at: new Date().toISOString() })
      .eq('id', currentTeacher.profile_id)
  }

  return NextResponse.json({ teacher })
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin(request)
  if ('error' in admin) return admin.error

  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID guru tidak ditemukan.' }, { status: 400 })
  }

  const { data: teacher, error: teacherError } = await admin.adminClient
    .from('teachers')
    .select('id,profile_id')
    .eq('id', id)
    .maybeSingle<{ id: string; profile_id: string | null }>()

  if (teacherError || !teacher) {
    return NextResponse.json({ error: teacherError?.message ?? 'Guru tidak ditemukan.' }, { status: 404 })
  }

  if (teacher.profile_id) {
    const { error: deleteUserError } = await admin.adminClient.auth.admin.deleteUser(teacher.profile_id)
    if (deleteUserError) {
      return NextResponse.json({ error: deleteUserError.message }, { status: 400 })
    }
  } else {
    const { error: deleteTeacherError } = await admin.adminClient.from('teachers').delete().eq('id', id)
    if (deleteTeacherError) {
      return NextResponse.json({ error: deleteTeacherError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true })
}
