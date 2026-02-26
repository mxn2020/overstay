import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthGuard, RedirectIfAuth } from './components/AuthGuard'
import LandingPage from './pages/LandingPage'
import PredictionPage from './pages/PredictionPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import LogsPage from './pages/LogsPage'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import HelpPage from './pages/HelpPage'
import AuditLogsPage from './pages/AuditLogsPage'
import SettingsPage from './pages/SettingsPage'
import BillingPage from './pages/BillingPage'
import NotFoundPage from './pages/NotFoundPage'
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
        reason: 'roast' | 'harmful'
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
                <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                <Route path="/billing" element={<AuthGuard><BillingPage /></AuthGuard>} />
                <Route path="/admin" element={<AuthGuard><AdminPage /></AuthGuard>} />
                <Route path="/logs" element={<AuthGuard><LogsPage /></AuthGuard>} />
                <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/audit-logs" element={<AuthGuard><AuditLogsPage /></AuthGuard>} />
                <Route path="*" element={<NotFoundPage onGoHome={() => navigate('/')} />} />
            </Routes>
        </Layout>
    )
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <AppRoutes />
            </BrowserRouter>
        </ErrorBoundary>
    )
}

export default App
