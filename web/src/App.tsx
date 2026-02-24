import { useState } from 'react'
import Layout from './components/Layout'
import LandingPage from './pages/LandingPage'
import PredictionPage from './pages/PredictionPage'
import ProfilePage from './pages/ProfilePage'
import AdminPage from './pages/AdminPage'
import LogsPage from './pages/LogsPage'
import NotFoundPage from './pages/NotFoundPage'

type Page = 'home' | 'prediction' | 'profile' | 'admin' | 'logs' | '404'

export interface PredictionResult {
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

interface AppProps {
    useConvex: boolean
}

function App({ useConvex }: AppProps) {
    const [page, setPage] = useState<Page>('home')
    const [prediction, setPrediction] = useState<PredictionResult | null>(null)

    const navigate = (p: Page) => setPage(p)

    const handlePrediction = (result: PredictionResult) => {
        setPrediction(result)
        setPage('prediction')
    }

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <LandingPage onPredict={handlePrediction} useConvex={useConvex} />
            case 'prediction':
                return prediction ? (
                    <PredictionPage prediction={prediction} onBack={() => navigate('home')} />
                ) : (
                    <LandingPage onPredict={handlePrediction} useConvex={useConvex} />
                )
            case 'profile':
                return <ProfilePage />
            case 'admin':
                return <AdminPage />
            case 'logs':
                return <LogsPage />
            default:
                return <NotFoundPage onGoHome={() => navigate('home')} />
        }
    }

    return (
        <Layout
            onNavigateHome={() => navigate('home')}
            onNavigateProfile={() => navigate('profile')}
            onNavigateAdmin={() => navigate('admin')}
            onNavigateLogs={() => navigate('logs')}
        >
            {renderPage()}
        </Layout>
    )
}

export default App
