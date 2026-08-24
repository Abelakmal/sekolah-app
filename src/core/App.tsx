'use client'

import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ArchivePage } from '../features/archive/ArchivePage'
import { AdminPage } from '../features/admin/AdminPage'
import { LoginPage } from '../features/auth/LoginPage'
import { BuilderPage } from '../features/builder/BuilderPage'
import { TopicDetailPanel } from '../features/topics/components/BankTabs'
import { TopicsPage } from '../features/topics/TopicsPage'
import { AppShell } from '../layouts/AppShell'
import { initialState } from './data/seed'
import { loadState, saveState, setActiveTeacher } from './storage'
import type { AppState, AppView, ClassGrade, LearningTopic, UserRole } from './types'

const authStorageKey = 'administrasiGuru.authSession.v1'
const adminEmail = 'admin@sekolah.test'
const adminPassword = 'admin123'
const teacherPassword = 'guru123'

type AuthSession = {
  role: UserRole
  teacherId?: string
}

export function App() {
  const [role, setRole] = useState<UserRole>('teacher')
  const [activeView, setActiveView] = useState<AppView>('topics')
  const [selectedGrade, setSelectedGrade] = useState<ClassGrade>(1)
  const [selectedTopicId, setSelectedTopicId] = useState('topic-1-1')
  const [state, setState] = useState<AppState>(initialState)
  const [isStorageReady, setIsStorageReady] = useState(false)
  const [authSession, setAuthSession] = useState<AuthSession | null>(null)
  const [loginEmail, setLoginEmail] = useState(initialState.teacher.email)
  const [loginError, setLoginError] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  useEffect(() => {
    const loadedState = loadState()
    const storedSession = loadAuthSession(loadedState)

    setState(storedSession?.role === 'teacher' && storedSession.teacherId ? setActiveTeacher(loadedState, storedSession.teacherId) : loadedState)
    setAuthSession(storedSession)
    setRole(storedSession?.role ?? 'teacher')
    setActiveView(storedSession?.role === 'admin' ? 'admin' : 'topics')
    setIsStorageReady(true)
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

  function login() {
    const normalizedEmail = loginEmail.trim().toLowerCase()

    if (normalizedEmail === adminEmail && loginPassword === adminPassword) {
      const session: AuthSession = { role: 'admin' }
      saveAuthSession(session)
      setAuthSession(session)
      setRole('admin')
      setActiveView('admin')
      setLoginError('')
      setLoginPassword('')
      return
    }

    const teacher = state.teachers.find((item) => item.email.toLowerCase() === normalizedEmail)
    if (teacher && loginPassword === teacherPassword) {
      const session: AuthSession = { role: 'teacher', teacherId: teacher.id }
      saveAuthSession(session)
      setAuthSession(session)
      setState((current) => setActiveTeacher(current, teacher.id))
      setRole('teacher')
      setActiveView('topics')
      setLoginError('')
      setLoginPassword('')
      return
    }

    setLoginError('Email atau password tidak sesuai.')
  }

  function logout() {
    clearAuthSession()
    setAuthSession(null)
    setRole('teacher')
    setActiveView('topics')
    setLoginEmail(state.teacher.email)
    setLoginPassword('')
    setLoginError('')
  }

  if (!authSession) {
    return (
      <LoginPage
        email={loginEmail}
        error={loginError}
        onEmailChange={setLoginEmail}
        onPasswordChange={setLoginPassword}
        onSubmit={login}
        password={loginPassword}
        state={state}
      />
    )
  }

  return (
    <AppShell activeView={activeView} onLogout={logout} onViewChange={setActiveView} role={role} state={state}>
      {renderContent({
        activeView,
        changeActiveTeacher,
        goToTopic,
        selectedGrade,
        selectedTopic,
        setActiveView,
        setSelectedGrade,
        setState,
        state,
      })}
    </AppShell>
  )
}

function loadAuthSession(state: AppState): AuthSession | null {
  if (typeof window === 'undefined') return null

  try {
    const parsed = JSON.parse(window.localStorage.getItem(authStorageKey) ?? 'null') as AuthSession | null
    if (parsed?.role === 'admin') return { role: 'admin' }
    if (parsed?.role === 'teacher' && state.teachers.some((teacher) => teacher.id === parsed.teacherId)) {
      return { role: 'teacher', teacherId: parsed.teacherId }
    }
  } catch {
    return null
  }

  return null
}

function saveAuthSession(session: AuthSession) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(authStorageKey, JSON.stringify(session))
}

function clearAuthSession() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(authStorageKey)
}

function renderContent({
  activeView,
  changeActiveTeacher,
  goToTopic,
  selectedGrade,
  selectedTopic,
  setActiveView,
  setSelectedGrade,
  setState,
  state,
}: {
  activeView: AppView
  changeActiveTeacher: (teacherId: string) => void
  goToTopic: (topic: LearningTopic) => void
  selectedGrade: ClassGrade
  selectedTopic?: LearningTopic
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
    return <TopicDetailPanel onBack={() => setActiveView('topics')} selectedTopic={selectedTopic} setState={setState} state={state} />
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
