export type UserRole = 'admin' | 'teacher'

export type AppView = 'admin' | 'topics' | 'topic-detail' | 'builder' | 'archive' | 'learning-devices'

export type ClassGrade = 1 | 2 | 3 | 4 | 5 | 6

export type AssessmentType = 'Diagnostik' | 'Formatif' | 'Sumatif'

export type Teacher = {
  id: string
  name: string
  email: string
  identityNumber: string
  identityType: 'NIP' | 'NUPTK' | 'No UKG' | 'NIM'
  subject: 'PJOK'
  classes: ClassGrade[]
}

export type SchoolProfile = {
  name: string
  principalName: string
  principalNip: string
}

export type Student = {
  id: string
  teacherId: string
  classGrade: ClassGrade
  name: string
  orderNumber: number
}

export type ModuleInfo = {
  academicYear: string
  semester: 'Ganjil' | 'Genap'
  phase: string
  subject: string
  mainMaterial: string
  subMaterial: string
  chapterMeeting: string
  timeAllocation: string
  learningMode: 'Teori' | 'Praktek' | 'Teori dan Praktek'
  learningModel: string
  learningMethods: string
  differentiationStrategy: string
  media: string
  toolsAndMaterials: string
  learningResources: string
  practiceArea: string
  sportEquipment: string
  enrichment: string
  remedial: string
  approvalPlace: string
  approvalDate: string
  studentCount: number
  targetStudents: string
}

export type ModuleCompetency = {
  initialCompetency: string
  pancasilaProfiles: string[]
  learningAchievements: string
  meaningfulUnderstanding: string
  triggerQuestions: string[]
  diagnosticQuestions: string[]
  affectivePreparation: string
  cognitivePreparation: string
  psychomotorPreparation: string
}

export type LearningTopic = {
  id: string
  teacherId: string
  classGrade: ClassGrade
  title: string
  description: string
  color: string
}

export type LearningObjective = {
  id: string
  topicId: string
  title: string
  description: string
}

export type MaterialAttachment = {
  name: string
  size: number
  type: string
  dataUrl: string
}

export type LearningMaterial = {
  id: string
  topicId: string
  title: string
  description: string
  attachment?: MaterialAttachment
  videoUrl?: string
}

export type LearningActivity = {
  id: string
  topicId: string
  name: string
  steps: string
  durationMinutes: number
}

export type ActivityBlockType = 'text' | 'heading' | 'callout' | 'image' | 'video'

export type ActivityBlock = {
  id: string
  type: ActivityBlockType
  content: string
  imageName?: string
  imageUrl?: string
  videoUrl?: string
}

export type LearningActivityPhase = {
  title: string
  steps: string
  durationMinutes: number
  blocks?: ActivityBlock[]
}

export type ModuleLearningActivities = {
  opening: LearningActivityPhase
  core: LearningActivityPhase
  closing: LearningActivityPhase
  contentDifferentiation: string
  processDifferentiation: string
  environmentDifferentiation: string
  teacherReflection: string
  studentReflection: string
}

export type Assessment = {
  id: string
  topicId: string
  type: AssessmentType
  description: string
}

export type RubricRow = {
  id: string
  aspect: string
  excellent: string
  good: string
  fair: string
  needsImprovement: string
}

export type ScoreRow = {
  id: string
  aspect: string
  maxScore: number
}

export type ModuleAssessments = {
  diagnosticAssessment: string
  formativeAssessment: string
  summativeAssessment: string
  groupRubricContext: string
  teacherNotes: string
  individualRubricObjective: string
  individualRubricTiming: string
  individualScoreScale: string
  practiceObjective: string
  practiceTiming: string
  practiceTask: string
  practiceTotalScore: number
  practiceCriteria: string
  studentSelfReflection: string
  groupRubric: RubricRow[]
  individualRubric: RubricRow[]
  attitudeScores: ScoreRow[]
  knowledgeScores: ScoreRow[]
  practiceScores: ScoreRow[]
}

export type WorksheetType = 'Berkelompok' | 'Individu'

export type Worksheet = {
  id: string
  type: WorksheetType
  title: string
  instructions: string
  questions: string
  answerArea: string
  answerKey: string
  content?: string
}

export type GlossaryTerm = {
  id: string
  term: string
  definition: string
}

export type AppendixFile = {
  id: string
  title: string
  description: string
  attachment?: MaterialAttachment
}

export type ReadingSection = {
  id: string
  title: string
  content: string
}

export type CustomAppendixSection = {
  id: string
  title: string
  content: string
}

export type ModuleAppendices = {
  readingMaterials: string
  readingSections: ReadingSection[]
  customSections: CustomAppendixSection[]
  learningMedia: string
  assessmentInstruments: string
  glossary: GlossaryTerm[]
  files: AppendixFile[]
}

export type AdministrationDraft = {
  id: string
  teacherId: string
  title: string
  topicId: string
  status: 'Draft' | 'Siap Review' | 'Final'
  version: number
  changeNotes: string
  lastDownloadedAt?: string
  objectiveIds: string[]
  materialIds: string[]
  activityIds: string[]
  assessmentIds: string[]
  createdAt: string
  updatedAt: string
}

export type AppState = {
  teacher: Teacher
  teachers: Teacher[]
  activeTeacherId: string
  school: SchoolProfile
  students: Student[]
  moduleInfo: Record<string, ModuleInfo>
  moduleCompetencies: Record<string, ModuleCompetency>
  moduleActivities: Record<string, ModuleLearningActivities>
  moduleAssessments: Record<string, ModuleAssessments>
  moduleWorksheets: Record<string, Worksheet[]>
  moduleAppendices: Record<string, ModuleAppendices>
  topics: LearningTopic[]
  objectives: LearningObjective[]
  materials: LearningMaterial[]
  activities: LearningActivity[]
  assessments: Assessment[]
  drafts: AdministrationDraft[]
}

export type BankTab = 'module-info' | 'competencies' | 'activities' | 'assessments' | 'attachments'
