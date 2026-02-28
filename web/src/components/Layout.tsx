import { useState, useEffect, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useConvexAuth } from "convex/react"
import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery, useMutation } from "convex/react"
import { api } from '../../convex/_generated/api'
import { getRandomRide, getRandomSafetyMessage } from '../lib/safeRide'
import { Menu, X, Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, RTL_LANGUAGES } from '../i18n/i18n'
import { logger } from '../lib/logger'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    const { t, i18n } = useTranslation()
    const [safetyMessage, setSafetyMessage] = useState(getRandomSafetyMessage())
    const [ride, setRide] = useState(getRandomRide())
    const { isAuthenticated } = useConvexAuth()
    const { signOut } = useAuthActions()
    const me = useQuery(api.users.getMe)
    const ensureProfile = useMutation(api.users.ensureProfile)
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [langOpen, setLangOpen] = useState(false)

    const isRTL = RTL_LANGUAGES.includes(i18n.language)

    // Auto-create profile if authenticated user doesn't have one
    useEffect(() => {
        if (isAuthenticated && me && !me.hasProfile) {
            ensureProfile({}).catch(logger.error)
        }
    }, [isAuthenticated, me, ensureProfile])

    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
        document.documentElement.lang = i18n.language
    }, [i18n.language, isRTL])

    useEffect(() => {
        const interval = setInterval(() => {
            setSafetyMessage(getRandomSafetyMessage())
            setRide(getRandomRide())
        }, 8000)
        return () => clearInterval(interval)
    }, [])

    const changeLang = (code: string) => {
        i18n.changeLanguage(code)
        setLangOpen(false)
    }

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0]

    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = ''
        }
        return () => { document.body.style.overflow = '' }
    }, [mobileMenuOpen])

    return (
        <div className="app">
            <header className="app__header">
                <Link to="/" className="app__logo">
                    <img src="/logo.png" alt="Logo" className="app__logo-img" />
                    JustOneLastDrink
                </Link>

                <button
                    className="app__mobile-toggle"
                    onClick={() => setMobileMenuOpen(o => !o)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                <nav className={`app__nav ${mobileMenuOpen ? 'app__nav--open' : ''}`}>
                    <Link to="/" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>{t('nav.home')}</Link>
                    <Link to="/storyboard" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>{t('nav.storyboard')}</Link>
                    {isAuthenticated && (
                        <Link to="/my-wall" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>🏆 {t('nav.myWall')}</Link>
                    )}
                    <Link to="/pricing" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>{t('nav.pricing')}</Link>
                    <Link to="/help" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>{t('nav.help')}</Link>
                    {isAuthenticated && me?.role === 'admin' && (
                        <>
                            <Link to="/admin" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>🔬 {t('nav.admin')}</Link>
                            <Link to="/logs" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>📋 {t('nav.aiLogs')}</Link>
                            <Link to="/audit-logs" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>🔍 {t('nav.audit')}</Link>
                        </>
                    )}
                    {isAuthenticated ? (
                        <>
                            <Link to="/settings" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>{t('nav.settings')}</Link>
                            <button className="app__nav-link" onClick={() => { signOut(); navigate('/'); setMobileMenuOpen(false); }}>
                                {t('nav.signOut')}
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="app__nav-link" onClick={() => setMobileMenuOpen(false)}>{t('nav.signIn')}</Link>
                    )}
                </nav>
            </header>

            <main className="app__main">
                {children}
            </main>

            <footer className="app__footer">
                <p>{t('footer.drinkResponsibly')}</p>
                <p style={{ marginTop: '4px' }}>
                    <a href="https://justonelastdrink.com">justonelastdrink.com</a> — {t('footer.tagline')}
                </p>
                {/* Language Switcher */}
                <div className="lang-switcher" style={{ marginTop: '12px' }}>
                    <button
                        className="lang-switcher__btn"
                        onClick={() => setLangOpen(o => !o)}
                    >
                        <Globe size={14} />
                        {currentLang.flag} {currentLang.name}
                    </button>
                    {langOpen && (
                        <div className="lang-switcher__dropdown">
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.code}
                                    className={`lang-switcher__option ${lang.code === i18n.language ? 'lang-switcher__option--active' : ''}`}
                                    onClick={() => changeLang(lang.code)}
                                >
                                    {lang.flag} {lang.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </footer>

            <div className="get-home-safe">
                <a
                    href={ride.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="get-home-safe__btn"
                    key={safetyMessage}
                >
                    {safetyMessage}
                </a>
            </div>
        </div>
    )
}
