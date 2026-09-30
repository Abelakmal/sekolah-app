import type { LearningTopic, ModuleInfo } from './types'

export function createModuleInfo(topic: LearningTopic, academicYear: string): ModuleInfo {
  return {
    academicYear, semester: 'Ganjil',
    phase: topic.classGrade >= 5 ? 'C' : topic.classGrade >= 3 ? 'B' : 'A',
    subject: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
    mainMaterial: topic.title, subMaterial: topic.title, chapterMeeting: '', timeAllocation: '',
    learningMode: 'Teori dan Praktek', learningModel: '', learningMethods: '', differentiationStrategy: '',
    media: '', toolsAndMaterials: '', learningResources: '', practiceArea: '', sportEquipment: '',
    enrichment: '', remedial: '', approvalPlace: '', approvalDate: '', studentCount: 0,
    targetStudents: `Peserta didik kelas ${topic.classGrade} dengan kemampuan bervariasi.`,
  }
}
