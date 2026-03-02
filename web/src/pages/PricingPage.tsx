import { useAction, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useNavigate, useLocation } from 'react-router-dom'
import { Zap, CreditCard, TrendingUp, Beer, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useToast } from '../components/Toast'
import { useDetectCurrency } from '../lib/useDetectCurrency'
import { useState, useEffect } from 'react'
import { MissingConfigDialog } from '../components/MissingConfigDialog'

const TOP_UP_PACKAGES = [
    { id: 'topup_40', credits: 40, priceUsd: '$1', perCreditUsd: '$0.025', priceEur: '€1', perCreditEur: '€0.025' },
    { id: 'topup_100', credits: 100, priceUsd: '$2', perCreditUsd: '$0.020', priceEur: '€2', perCreditEur: '€0.020', popular: true },
    { id: 'topup_250', credits: 250, priceUsd: '$4', perCreditUsd: '$0.016', priceEur: '€4', perCreditEur: '€0.016', best: true },
]

type Plan = {
    id: string
    name: string
    description?: string
    planKey: string
    appSlug: string
    features: string[]
    price?: {
        id: string
        amount: number
        currency: string
        interval?: string
    }
}

export default function PricingPage() {
    const { t } = useTranslation()
    const { showToast } = useToast()
    const { isAuthenticated } = useConvexAuth()
    const subscription = useQuery(api.stripe.getSubscription)
    const balance = useQuery(api.credits.getBalance)
    const createCheckout = useAction(api.stripe.createCheckoutSession)
    const getActivePlans = useAction(api.stripe.getActivePlans)
    const createTopUp = useAction(api.stripe.createTopUpSession)
    const navigate = useNavigate()
    const location = useLocation()
    const currency = useDetectCurrency()

    const [configError, setConfigError] = useState<string | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)

    useEffect(() => {
        getActivePlans()
            .then(data => {
                const appPlans = data.filter((p: Plan) => p.appSlug === 'overstay' || p.appSlug === 'unknown')
                setPlans(appPlans)
            })
            .catch(err => {
                const msg = err instanceof Error ? err.message : String(err)
                if (msg.includes('not configured')) setConfigError(msg)
                console.error(err)
            })
            .finally(() => setLoadingPlans(false))
    }, [getActivePlans])

    const currentPlan = subscription?.plan ?? 'free'
    const credits = balance?.credits ?? 0
    const needSubscription = (location.state as { needSubscription?: boolean })?.needSubscription

    const handleSubscribe = async (planKey: string, priceId: string) => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        try {
            const { url } = await createCheckout({ planKey, priceId, currency })
            if (url) window.location.assign(url)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create checkout'
            if (msg.includes('not configured')) {
                setConfigError(msg)
            } else {
                showToast(msg, 'error')
            }
        }
    }

    const handleTopUp = async (packageId: string) => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        try {
            const { url } = await createTopUp({ packageId, currency })
            if (url) window.location.assign(url)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create checkout'
            if (msg.includes('not configured')) {
                setConfigError(msg)
            } else {
                showToast(msg, 'error')
            }
        }
    }

    return (
        <div className="pricing-page">
            {configError && (
                <MissingConfigDialog
                    message={configError}
                    onClose={() => setConfigError(null)}
                />
            )}

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
                        <span className="pricing-balance__plan">{currentPlan.toUpperCase()}</span>
                    </div>
                )}
            </div>

            {loadingPlans ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
                    <Loader2 size={48} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                </div>
            ) : (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap', marginBottom: '48px' }}>
                    {plans.map((plan) => (
                        <div key={plan.id} className="pricing-card pricing-card--popular" style={{ maxWidth: '420px', width: '100%' }}>
                            <div className="pricing-card__badge">🍻 {t('pricing.bestValue')}</div>
                            <div className="pricing-card__header">
                                <h2><Beer size={22} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> {plan.name}</h2>
                                <div className="pricing-card__price">
                                    {currency === 'eur' ? '€' : '$'}
                                    {plan.price ? (plan.price.amount / 100).toFixed(0) : '0'}
                                    {plan.price?.interval && <span>/{plan.price.interval === 'month' ? t('pricing.proMonth').replace('/', '') : 'yr'}</span>}
                                </div>
                            </div>

                            {plan.description && (
                                <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.9rem', marginBottom: '16px' }}>
                                    {plan.description}
                                </p>
                            )}

                            <ul className="pricing-card__features">
                                {plan.features.length > 0 ? plan.features.map((feature, i) => (
                                    <li key={i}>✅ {feature}</li>
                                )) : (
                                    <>
                                        <li><Zap size={14} /> {t('pricing.proFeature1')}</li>
                                        <li>✅ {t('pricing.proFeature2')}</li>
                                        <li>✅ {t('pricing.proFeature3')}</li>
                                        <li>✅ {t('pricing.proFeature4')}</li>
                                    </>
                                )}
                            </ul>

                            <button
                                className="btn btn--primary pricing-card__btn"
                                disabled={currentPlan === plan.planKey}
                                onClick={() => handleSubscribe(plan.planKey, plan.price!.id)}
                            >
                                {currentPlan === plan.planKey ? `✅ ${t('pricing.currentPlan')}` : `🍻 ${t('pricing.subscribe').replace('$3/mo', '')} ${plan.name}`}
                            </button>
                        </div>
                    ))}

                    {plans.length === 0 && (
                        <div className="pricing-card" style={{ maxWidth: '420px', width: '100%' }}>
                            <div className="pricing-card__header">
                                <h2>No active plans</h2>
                                <p style={{ color: 'var(--color-smoke-gray)' }}>No subscription plans found in Stripe.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
