import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import PredictionPage from './pages/PredictionPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import LogsPage from './pages/LogsPage'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import HelpPage from './pages/HelpPage'
import AuditLogsPage from './pages/AuditLogsPage'
import { useState } from 'react'

export type SuccessPrediction = {
    rejected?: false
    predictionId: string
    exitTime: string
    overstayMinutes: number
    chaosRating: number
    textRegret: number
    barHop: number
    cryRisk: number
    sunriseRisk: string
    roastLine: string
    imageUrl?: string
}

export type PredictionResult =
    | {
        rejected: true
        rejectReason: string
    }
    | SuccessPrediction

function AppRoutes() {
    const [prediction, setPrediction] = useState<PredictionResult | null>(null)
    const navigate = useNavigate()

    const handleNewPrediction = () => {
        setPrediction(null)
        navigate('/')
    }

    return (
        <Layout>
            <Routes>
                <Route path="/" element={<LandingPage onPredict={(r) => setPrediction(r)} useConvex={true} />} />
                <Route path="/prediction" element={
                    prediction
                        ? <PredictionPage prediction={prediction} onBack={handleNewPrediction} />
                        : <LandingPage onPredict={(r) => setPrediction(r)} useConvex={true} />
                } />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/audit-logs" element={<AuditLogsPage />} />
            </Routes>
        </Layout>
    )
}

function App() {
    return (
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    )
}

export default App
