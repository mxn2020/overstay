import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Layout from './components/Layout'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthGuard, RedirectIfAuth } from './components/AuthGuard'
import { SubscriptionGuard } from './components/SubscriptionGuard'
import CookieBanner from './components/CookieBanner'
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
import StoryboardPage from './pages/StoryboardPage'
import MyWallPage from './pages/MyWallPage'
import NotFoundPage from './pages/NotFoundPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import ModelTestPage from './pages/ModelTestPage'
import { useState } from 'react'

export type SuccessPrediction = {
    rejected?: false
    predictionId: string
    exitTime: string
    justOneLastDrinkMinutes: number
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
                {/* Auth-only routes that also require a subscription */}
                <Route path="/profile" element={<AuthGuard><SubscriptionGuard><ProfilePage /></SubscriptionGuard></AuthGuard>} />
                <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
                <Route path="/billing" element={<AuthGuard><BillingPage /></AuthGuard>} />
                <Route path="/storyboard" element={<AuthGuard><StoryboardPage /></AuthGuard>} />
                <Route path="/my-wall" element={<AuthGuard><SubscriptionGuard><MyWallPage /></SubscriptionGuard></AuthGuard>} />
                {/* Admin routes — SubscriptionGuard allows admins */}
                <Route path="/admin" element={<AuthGuard><SubscriptionGuard><AdminPage /></SubscriptionGuard></AuthGuard>} />
                <Route path="/logs" element={<AuthGuard><SubscriptionGuard><LogsPage /></SubscriptionGuard></AuthGuard>} />
                <Route path="/audit-logs" element={<AuthGuard><SubscriptionGuard><AuditLogsPage /></SubscriptionGuard></AuthGuard>} />
                <Route path="/model-tests" element={<AuthGuard><SubscriptionGuard><ModelTestPage /></SubscriptionGuard></AuthGuard>} />
                {/* Public routes */}
                <Route path="/login" element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="*" element={<NotFoundPage onGoHome={() => navigate('/')} />} />
            </Routes>
            <CookieBanner />
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
