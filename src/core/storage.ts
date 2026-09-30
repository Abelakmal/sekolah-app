import { initialState } from './data/seed'
import type { AppState, LearningTopic, ModuleInfo, Student, Teacher } from './types'

export const appStorageKey = 'administrasiGuru.appState.v1'

export function loadState(): AppState {
  if (typeof window === 'undefined') {
    return initialState
  }

  window.localStorage.removeItem('administrasiGuru.manualBackup.v1')
  const stored = window.localStorage.getItem(appStorageKey)

  if (!stored) {
    return initialState
  }

  try {
    const parsed = JSON.parse(stored) as Partial<AppState>
    if ('drafts' in parsed) {
      delete parsed.drafts
      window.localStorage.setItem(appStorageKey, JSON.stringify(parsed))
    }
    return normalizeState(parsed)
  } catch {
    return initialState
  }
}

export function saveState(state: AppState) {
  if (typeof window === 'undefined') return

  const persisted: Partial<AppState> = { ...state }
  delete persisted.drafts
  window.localStorage.setItem(appStorageKey, JSON.stringify(persisted))
  window.localStorage.removeItem('administrasiGuru.manualBackup.v1')
}

export function normalizeState(parsed: Partial<AppState>): AppState {
  const legacyTeacher = {
    ...initialState.teacher,
    ...parsed.teacher,
  }
  const teachers = normalizeTeachers(parsed.teachers, legacyTeacher)
  const activeTeacherId = teachers.some((teacher) => teacher.id === parsed.activeTeacherId) ? parsed.activeTeacherId! : teachers[0].id
  const activeTeacher = teachers.find((teacher) => teacher.id === activeTeacherId) ?? teachers[0]

  return {
    ...initialState,
    ...parsed,
    teacher: activeTeacher,
    teachers,
    activeTeacherId,
    school: {
      ...initialState.school,
      ...parsed.school,
    },
    students: normalizeOwnedItems(parsed.students ?? initialState.students, activeTeacherId),
    moduleInfo: mergeModuleInfo(parsed.moduleInfo),
    moduleCompetencies: {
      ...initialState.moduleCompetencies,
      ...parsed.moduleCompetencies,
    },
    moduleActivities: {
      ...initialState.moduleActivities,
      ...parsed.moduleActivities,
    },
    moduleAssessments: {
      ...initialState.moduleAssessments,
      ...parsed.moduleAssessments,
    },
    moduleWorksheets: {
      ...initialState.moduleWorksheets,
      ...parsed.moduleWorksheets,
    },
    moduleAppendices: {
      ...initialState.moduleAppendices,
      ...parsed.moduleAppendices,
    },
    topics: normalizeOwnedItems(parsed.topics ?? initialState.topics, activeTeacherId),
    drafts: [],
  } as AppState
}

export function setActiveTeacher(state: AppState, teacherId: string): AppState {
  const nextTeacher = state.teachers.find((teacher) => teacher.id === teacherId)
  if (!nextTeacher) return state

  return {
    ...state,
    activeTeacherId: nextTeacher.id,
    teacher: nextTeacher,
  }
}

export function updateTeacherInState(state: AppState, teacher: Teacher): AppState {
  const teachers = state.teachers.map((item) => (item.id === teacher.id ? teacher : item))
  return {
    ...state,
    activeTeacherId: state.activeTeacherId === teacher.id ? teacher.id : state.activeTeacherId,
    teacher: state.activeTeacherId === teacher.id ? teacher : state.teacher,
    teachers,
  }
}

function normalizeTeachers(parsedTeachers: Teacher[] | undefined, legacyTeacher: Teacher): Teacher[] {
  const teachers = parsedTeachers?.length ? parsedTeachers : [legacyTeacher]
  return teachers.map((teacher) => ({
    ...initialState.teacher,
    ...teacher,
    subject: 'PJOK',
    classes: teacher.classes?.length ? teacher.classes : initialState.teacher.classes,
  }))
}

function normalizeOwnedItems<T extends LearningTopic | Student>(items: T[], teacherId: string): T[] {
  return items.map((item) => ({
    ...item,
    teacherId: item.teacherId ?? teacherId,
  }))
}

function mergeModuleInfo(parsed?: Partial<Record<string, Partial<ModuleInfo>>>): Record<string, ModuleInfo> {
  const merged = { ...initialState.moduleInfo }

  if (!parsed) return merged

  Object.entries(parsed).forEach(([topicId, info]) => {
    merged[topicId] = {
      ...(initialState.moduleInfo[topicId] ?? {
        academicYear: '2024/2025',
        semester: 'Ganjil',
        phase: '',
        subject: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
        mainMaterial: '',
        subMaterial: '',
        chapterMeeting: '',
        timeAllocation: '',
        learningMode: 'Teori dan Praktek',
        learningModel: '',
        learningMethods: '',
        differentiationStrategy: '',
        media: '',
        toolsAndMaterials: '',
        learningResources: '',
        practiceArea: '',
        sportEquipment: '',
        enrichment: '',
        remedial: '',
        approvalPlace: '',
        approvalDate: '',
        studentCount: 0,
        targetStudents: '',
      }),
      ...info,
    }
  })

  return merged
}
