'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ArchivePage } from '../features/archive/ArchivePage'
import { AdminPage } from '../features/admin/AdminPage'
import { LoginPage } from '../features/auth/LoginPage'
import { BuilderPage } from '../features/builder/BuilderPage'
import { LearningDevicesPage } from '../features/learning-devices/LearningDevicesPage'
import { TopicDetailPanel } from '../features/topics/components/BankTabs'
import { TopicsPage } from '../features/topics/TopicsPage'
import { AppShell } from '../layouts/AppShell'
import { initialState } from './data/seed'
import { loadState, saveState, setActiveTeacher } from './storage'
import { supabase } from './supabase/client'
import { mapSupabaseTeacher } from './supabase/types'
import type { SupabaseProfile, SupabaseTeacher } from './supabase/types'
import type { AppState, AppView, BankTab, ClassGrade, LearningTopic, UserRole } from './types'

type AuthSession = {
  role: UserRole
  teacherId?: string
}

export function App() {
  const [role, setRole] = useState<UserRole>('teacher')
  const [activeView, setActiveView] = useState<AppView>('topics')
  const [activeTopicTab, setActiveTopicTab] = useState<BankTab>('module-info')
  const [selectedGrade, setSelectedGrade] = useState<ClassGrade>(1)
  const [selectedTopicId, setSelectedTopicId] = useState('topic-1-1')
  const [state, setState] = useState<AppState>(initialState)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  useEffect(() => {
    const loadedState = loadState()
    setState(loadedState)
    setIsStorageReady(true)

    void hydrateAuthSession(loadedState)
    // Supabase session hydration is intentionally run once during client boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isStorageReady) {
      saveState(state)
    }
  }, [isStorageReady, state])

  useEffect(() => {
    if (role === 'admin' && activeView !== 'admin') {
      setActiveView('admin')
    }

    if (role === 'teacher' && activeView === 'admin') {
      setActiveView('topics')
    }
  }, [activeView, role])

  const visibleTopics = state.topics.filter((topic) => topic.teacherId === state.activeTeacherId && state.teacher.classes.includes(topic.classGrade))
  const selectedTopic = visibleTopics.find((topic) => topic.id === selectedTopicId) ?? visibleTopics[0]

  useEffect(() => {
    if (selectedTopic && selectedTopic.id !== selectedTopicId) {
      setSelectedTopicId(selectedTopic.id)
      setSelectedGrade(selectedTopic.classGrade)
    }
  }, [selectedTopic, selectedTopicId])

  function goToTopic(topic: LearningTopic) {
    setSelectedGrade(topic.classGrade)
    setSelectedTopicId(topic.id)
    setActiveView('topic-detail')
  }

  function changeActiveTeacher(teacherId: string) {
    setState((current) => setActiveTeacher(current, teacherId))
    const nextTeacher = state.teachers.find((teacher) => teacher.id === teacherId)
    const nextTopic = state.topics.find((topic) => topic.teacherId === teacherId && nextTeacher?.classes.includes(topic.classGrade))
    if (nextTopic) {
      setSelectedGrade(nextTopic.classGrade)
      setSelectedTopicId(nextTopic.id)
    }
  }

  async function hydrateAuthSession(baseState: AppState) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      setIsAuthReady(true)
      return
    }

    await applySupabaseSession(session.user.id, baseState)
    setIsAuthReady(true)
  }

  async function applySupabaseSession(userId: string, baseState = state) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id,email,name,role,teacher_id')
      .eq('id', userId)
      .maybeSingle<SupabaseProfile>()

    if (profileError) {
      await supabase.auth.signOut()
      setAuthSession(null)
      setLoginError(`Profil user tidak bisa dibaca: ${profileError.message}`)
      return
    }

    if (!profile) {
      await supabase.auth.signOut()
      setAuthSession(null)
      setLoginError('Profil user belum tersedia di Supabase.')
      return
    }

    if (profile.role === 'admin') {
      const { data: teacherRows } = await supabase
        .from('teachers')
        .select('id,profile_id,name,email,identity_type,identity_number,subject,classes')
        .returns<SupabaseTeacher[]>()

      if (teacherRows) {
        const teachers = teacherRows.map(mapSupabaseTeacher)
        const activeTeacher = teachers.find((teacher) => teacher.id === baseState.activeTeacherId) ?? teachers[0]
        setState({
          ...baseState,
          teachers,
          ...(activeTeacher
            ? {
                teacher: activeTeacher,
                activeTeacherId: activeTeacher.id,
              }
            : {}),
        })
      }

      setAuthSession({ role: 'admin' })
      setRole('admin')
      setActiveView('admin')
      setLoginError('')
      return
    }

    if (!profile.teacher_id) {
      await supabase.auth.signOut()
      setAuthSession(null)
      setLoginError('Data guru untuk user ini belum tersedia.')
      return
    }

    const { data: teacherRow, error: teacherError } = await supabase
      .from('teachers')
      .select('id,profile_id,name,email,identity_type,identity_number,subject,classes')
      .eq('id', profile.teacher_id)
      .maybeSingle<SupabaseTeacher>()

    if (teacherError || !teacherRow) {
      await supabase.auth.signOut()
      setAuthSession(null)
      setLoginError('Data guru tidak dapat dibaca dari Supabase.')
      return
    }

    const teacher = mapSupabaseTeacher(teacherRow)
    const nextState = {
      ...baseState,
      teacher,
      activeTeacherId: teacher.id,
      teachers: [teacher, ...baseState.teachers.filter((item) => item.id !== teacher.id)],
    }

    setState(nextState)
    setAuthSession({ role: 'teacher', teacherId: teacher.id })
    setRole('teacher')
    setActiveView('topics')
    setLoginError('')
  }

  async function login() {
    setLoginError('')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim().toLowerCase(),
      password: loginPassword,
    })

    if (error || !data.user) {
      setLoginError('Email atau password tidak sesuai.')
      return
    }

    await applySupabaseSession(data.user.id)
    setLoginPassword('')
  }

  async function logout() {
    await supabase.auth.signOut()
    setAuthSession(null)
    setRole('teacher')
    setActiveView('topics')
    setLoginEmail('')
    setLoginPassword('')
    setLoginError('')
  }

  if (!isAuthReady) {
    return <div className="grid min-h-screen place-items-center bg-slate-100 text-sm font-medium text-slate-600">Memuat sesi...</div>
  }

  if (!authSession) {
    return (
      <LoginPage
        email={loginEmail}
        error={loginError}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={() => void login()}
        password={loginPassword}
      />
    )
  }

  return (
    <AppShell
      activeTopicTab={activeTopicTab}
      activeView={activeView}
      onLogout={() => void logout()}
      onTopicTabChange={setActiveTopicTab}
      onViewChange={setActiveView}
      role={role}
      selectedTopic={selectedTopic}
      state={state}
    >
      {renderContent({
        activeView,
        changeActiveTeacher,
        goToTopic,
        selectedGrade,
        selectedTopic,
        activeTopicTab,
        setActiveTopicTab,
        setActiveView,
        setSelectedGrade,
        setState,
        state,
      })}
    </AppShell>
  )
}

function renderContent({
  activeView,
  activeTopicTab,
  changeActiveTeacher,
  goToTopic,
  selectedGrade,
  selectedTopic,
  setActiveTopicTab,
  setActiveView,
  setSelectedGrade,
  setState,
  state,
}: {
  activeView: AppView
  activeTopicTab: BankTab
  changeActiveTeacher: (teacherId: string) => void
  goToTopic: (topic: LearningTopic) => void
  selectedGrade: ClassGrade
  selectedTopic?: LearningTopic
  setActiveTopicTab: (tab: BankTab) => void
  setActiveView: (view: AppView) => void
  setSelectedGrade: (grade: ClassGrade) => void
  setState: Dispatch<SetStateAction<AppState>>
  state: AppState
}) {
  if (activeView === 'admin') {
    return <AdminPage onActiveTeacherChange={changeActiveTeacher} setState={setState} state={state} />
  }

  if (activeView === 'topics') {
    return (
      <TopicsPage
        goToTopic={goToTopic}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        setState={setState}
        state={state}
      />
    )
  }

  if (activeView === 'topic-detail') {
    if (!selectedTopic) {
      return (
        <TopicsPage
          goToTopic={goToTopic}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          setState={setState}
          state={state}
        />
      )
    }
    return <TopicDetailPanel activeTab={activeTopicTab} onBack={() => setActiveView('topics')} onTopicTabChange={setActiveTopicTab} selectedTopic={selectedTopic} setState={setState} state={state} />
  }

  if (activeView === 'builder') {
    if (!selectedTopic) {
      return (
        <TopicsPage
          goToTopic={goToTopic}
          selectedGrade={selectedGrade}
          setSelectedGrade={setSelectedGrade}
          setState={setState}
          state={state}
        />
      )
    }
    return <BuilderPage selectedTopic={selectedTopic} setState={setState} state={state} />
  }

  if (activeView === 'archive') {
    return <ArchivePage setActiveView={setActiveView} setState={setState} state={state} />
  }

  if (activeView === 'learning-devices') {
    return <LearningDevicesPage teacherId={state.activeTeacherId} />
  }

  return (
    <TopicsPage
      goToTopic={goToTopic}
      selectedGrade={selectedGrade}
      setSelectedGrade={setSelectedGrade}
      setState={setState}
      state={state}
    />
  )
}
