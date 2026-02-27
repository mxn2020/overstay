import { useAction, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, CreditCard, TrendingUp, Beer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../components/Toast'
import { useDetectCurrency, type Currency } from '../lib/useDetectCurrency'

const TOP_UP_PACKAGES = [
    { id: 'topup_40', credits: 40, priceUsd: '$1', perCreditUsd: '$0.025', priceEur: '€1', perCreditEur: '€0.025' },
    { id: 'topup_100', credits: 100, priceUsd: '$2', perCreditUsd: '$0.020', priceEur: '€2', perCreditEur: '€0.020', popular: true },
    { id: 'topup_250', credits: 250, priceUsd: '$4', perCreditUsd: '$0.016', priceEur: '€4', perCreditEur: '€0.016', best: true },
]

export default function PricingPage() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const { isAuthenticated } = useConvexAuth()
    const subscription = useQuery(api.stripe.getSubscription)
    const balance = useQuery(api.credits.getBalance)
    const createCheckout = useAction(api.stripe.createCheckoutSession)
    const createTopUp = useAction(api.stripe.createTopUpSession)
    const navigate = useNavigate()
    const location = useLocation()
    const currency = useDetectCurrency()

    const currentPlan = subscription?.plan ?? 'free'
    const credits = balance?.credits ?? 0
    const needSubscription = (location.state as { needSubscription?: boolean })?.needSubscription

    const proPriceStr = currency === 'eur' ? '€3' : '$3'

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        try {
            const { url } = await createCheckout({ plan: 'paid', currency })
            if (url) window.location.href = url
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to create checkout', 'error')
        }
    }

    const handleTopUp = async (packageId: string) => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        try {
            const { url } = await createTopUp({ packageId, currency })
            if (url) window.location.href = url
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to create checkout', 'error')
        }
    }

    return (
        <div className="pricing-page">
            {/* Onboarding callout for users redirected here */}
            {needSubscription && (
                <div className="pricing-onboarding">
                    <p>🍻 <strong>Subscribe to unlock all features!</strong> Get 100 credits/month and access the full experience.</p>
                </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl, 48px)' }}>
                <h1>💰 {t('pricing.title')}</h1>
                <p style={{ color: 'var(--color-smoke-gray, #999)', fontSize: '1.1rem', marginTop: '8px' }}>
                    {t('pricing.subtitle')}
                </p>
                {isAuthenticated && (
                    <div className="pricing-balance">
                        <Zap size={20} />
                        <span>{credits} {t('pricing.credits')}</span>
                        <span className="pricing-balance__plan">{currentPlan === 'paid' ? "LET'S HAVE FUN" : 'FREE'}</span>
                    </div>
                )}
            </div>

            {/* Single Plan: Let's Have Fun */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
                <div className="pricing-card pricing-card--popular" style={{ maxWidth: '420px' }}>
                    <div className="pricing-card__badge">🍻 {t('pricing.bestValue')}</div>
                    <div className="pricing-card__header">
                        <h2><Beer size={22} /> Let's Have Fun</h2>
                        <div className="pricing-card__price">{proPriceStr}<span>{t('pricing.proMonth')}</span></div>
                    </div>
                    <ul className="pricing-card__features">
                        <li><Zap size={14} /> {t('pricing.proFeature1')}</li>
                        <li>✅ {t('pricing.proFeature2')}</li>
                        <li>✅ {t('pricing.proFeature3')}</li>
                        <li>✅ {t('pricing.proFeature4')}</li>
                        <li>✅ {t('pricing.proFeature5')}</li>
                    </ul>
                    <button
                        className="btn btn--primary pricing-card__btn"
                        disabled={currentPlan === 'paid'}
                        onClick={handleSubscribe}
                    >
                        {currentPlan === 'paid' ? `✅ ${t('pricing.currentPlan')}` : `🍻 ${t('pricing.subscribe').replace('$3/mo', `${proPriceStr}${t('pricing.proMonth')}`)}`}
                    </button>
                </div>
            </div>

            {/* Top-Up Section */}
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ marginBottom: '8px' }}>
                    <TrendingUp size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    {t('pricing.topUps')}
                </h2>
                <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '24px' }}>
                    {t('pricing.topUpsSubtitle')}
                </p>

                <div className="topup-grid">
                    {TOP_UP_PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`topup-card ${pkg.popular ? 'topup-card--popular' : ''} ${pkg.best ? 'topup-card--best' : ''}`}
                        >
                            {pkg.popular && <div className="topup-card__badge">{t('pricing.popular')}</div>}
                            {pkg.best && <div className="topup-card__badge topup-card__badge--best">{t('pricing.bestDeal')}</div>}
                            <div className="topup-card__credits">
                                <Zap size={18} />
                                {pkg.credits}
                            </div>
                            <div className="topup-card__price">{currency === 'eur' ? pkg.priceEur : pkg.priceUsd}</div>
                            <div className="topup-card__per">{currency === 'eur' ? pkg.perCreditEur : pkg.perCreditUsd}{t('pricing.perCredit')}</div>
                            <button
                                className="btn btn--secondary"
                                onClick={() => handleTopUp(pkg.id)}
                            >
                                <CreditCard size={14} /> {t('pricing.buy')}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
