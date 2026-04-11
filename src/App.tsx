import { useState, useCallback } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ParticipantsPage } from './pages/ParticipantsPage'
import { SchedulePage } from './pages/SchedulePage'
import { MapPage } from './pages/MapPage'
import { OrganizerPage } from './pages/OrganizerPage'
import { WelcomeScreen } from './components/welcome/WelcomeScreen'
import { useParticipantsStore } from './store/participants'
import { generateTestData } from './lib/testdata'
import { loadTestDataConfig } from './lib/storage'

const WELCOMED_KEY = 'running-dinner-welcomed'

function AppInner() {
  const navigate = useNavigate()
  const setAll = useParticipantsStore((s) => s.setAll)
  const [welcomed, setWelcomed] = useState(() => localStorage.getItem(WELCOMED_KEY) === 'true')

  const dismiss = useCallback(() => {
    localStorage.setItem(WELCOMED_KEY, 'true')
    setWelcomed(true)
  }, [])

  const handleManual = useCallback(() => {
    dismiss()
    navigate('/participants')
  }, [dismiss, navigate])

  const handleTestData = useCallback(async () => {
    dismiss()
    navigate('/participants')
    const config = loadTestDataConfig()
    const participants = await generateTestData(config)
    setAll(participants)
  }, [dismiss, navigate, setAll])

  if (!welcomed) {
    return <WelcomeScreen onStartManual={handleManual} onStartTestData={handleTestData} />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/participants" replace />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/organizer" element={<OrganizerPage />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return <AppInner />
}

export default App

