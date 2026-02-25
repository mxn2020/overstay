import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import PredictionPage from './pages/PredictionPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import LogsPage from './pages/LogsPage'
import LoginPage from './pages/LoginPage'
import PricingPage from './pages/PricingPage'
import HelpPage from './pages/HelpPage'
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

function App() {
    const [prediction, setPrediction] = useState<PredictionResult | null>(null)

    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<LandingPage onPredict={(r) => setPrediction(r)} useConvex={true} />} />
                    <Route path="/prediction" element={
                        prediction
                            ? <PredictionPage prediction={prediction} onBack={() => window.history.back()} />
                            : <LandingPage onPredict={(r) => setPrediction(r)} useConvex={true} />
                    } />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/logs" element={<LogsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/help" element={<HelpPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    )
}

export default App
