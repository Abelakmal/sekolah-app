import type { LearningTopic, Teacher, UserRole } from '../types'

export type SupabaseProfile = {
  id: string
  email: string
  name: string
  role: UserRole
  teacher_id: string | null
}

export type SupabaseTeacher = {
  id: string
  profile_id: string | null
  name: string
  email: string
  identity_type: Teacher['identityType']
  identity_number: string
  subject: 'PJOK'
  classes: number[]
  school_name: string
  principal_name: string
  principal_nip: string
  institution_name: string
  institution_logo_url: string
}

export type SupabaseLearningTopic = {
  id: string
  teacher_id: string
  class_grade: number
  title: string
  description: string
  color: string
  created_at: string
  updated_at: string
}

export function mapSupabaseTeacher(row: SupabaseTeacher): Teacher {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    identityNumber: row.identity_number,
    identityType: row.identity_type,
    subject: 'PJOK',
    classes: row.classes.filter((grade): grade is Teacher['classes'][number] => grade >= 1 && grade <= 6),
    schoolName: row.school_name ?? '',
    principalName: row.principal_name ?? '',
    principalNip: row.principal_nip ?? '',
    institutionName: row.institution_name ?? '',
    institutionLogoUrl: row.institution_logo_url ?? '',
  }
}

export function mapSupabaseLearningTopic(row: SupabaseLearningTopic): LearningTopic {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    classGrade: row.class_grade as LearningTopic['classGrade'],
    title: row.title,
    description: row.description,
    color: row.color,
  }
}
