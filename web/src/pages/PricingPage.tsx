import { useAction, useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useNavigate } from 'react-router-dom'
import { Zap, CreditCard, Star, TrendingUp } from 'lucide-react'

const TOP_UP_PACKAGES = [
    { id: 'topup_40', credits: 40, price: '$1', perCredit: '$0.025' },
    { id: 'topup_100', credits: 100, price: '$2', perCredit: '$0.020', popular: true },
    { id: 'topup_250', credits: 250, price: '$4', perCredit: '$0.016', best: true },
]

export default function PricingPage() {
    const { isAuthenticated } = useConvexAuth()
    const subscription = useQuery(api.stripe.getSubscription)
    const balance = useQuery(api.credits.getBalance)
    const createCheckout = useAction(api.stripe.createCheckoutSession)
    const createTopUp = useAction(api.stripe.createTopUpSession)
    const navigate = useNavigate()

    const currentPlan = subscription?.plan ?? 'free'
    const credits = balance?.credits ?? 0

    const handleSubscribe = async () => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        try {
            const { url } = await createCheckout({ plan: 'paid' })
            if (url) window.location.href = url
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create checkout')
        }
    }

    const handleTopUp = async (packageId: string) => {
        if (!isAuthenticated) {
            navigate('/login')
            return
        }
        try {
            const { url } = await createTopUp({ packageId })
            if (url) window.location.href = url
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create checkout')
        }
    }

    return (
        <div className="pricing-page">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl, 48px)' }}>
                <h1>💰 Simple, Fair Pricing</h1>
                <p style={{ color: 'var(--color-smoke-gray, #999)', fontSize: '1.1rem', marginTop: '8px' }}>
                    1 prediction = 4 credits. No hidden fees.
                </p>
                {isAuthenticated && (
                    <div className="pricing-balance">
                        <Zap size={20} />
                        <span>{credits} credits</span>
                        <span className="pricing-balance__plan">{currentPlan === 'paid' ? 'PRO' : 'FREE'}</span>
                    </div>
                )}
            </div>

            {/* Main Plan */}
            <div className="pricing-grid">
                <div className="pricing-card">
                    <div className="pricing-card__header">
                        <h2>Free Trial</h2>
                        <div className="pricing-card__price">$0</div>
                    </div>
                    <ul className="pricing-card__features">
                        <li>✅ 1 free prediction</li>
                        <li>✅ Full AI analysis</li>
                        <li>✅ Downloadable card</li>
                        <li>❌ No account needed</li>
                        <li>❌ No sharing</li>
                    </ul>
                    <button className="btn btn--secondary pricing-card__btn" disabled>
                        Try It Free
                    </button>
                </div>

                <div className="pricing-card pricing-card--popular">
                    <div className="pricing-card__badge">Best Value</div>
                    <div className="pricing-card__header">
                        <h2><Star size={20} /> Pro</h2>
                        <div className="pricing-card__price">$3<span>/mo</span></div>
                    </div>
                    <ul className="pricing-card__features">
                        <li><Zap size={14} /> 100 credits/month</li>
                        <li>✅ 25 predictions included</li>
                        <li>✅ Share to storyboard</li>
                        <li>✅ Full history</li>
                        <li>✅ Priority processing</li>
                    </ul>
                    <button
                        className="btn btn--primary pricing-card__btn"
                        disabled={currentPlan === 'paid'}
                        onClick={handleSubscribe}
                    >
                        {currentPlan === 'paid' ? '✅ Current Plan' : 'Subscribe — $3/mo'}
                    </button>
                </div>
            </div>

            {/* Top-Up Section */}
            <div style={{ marginTop: '48px', textAlign: 'center' }}>
                <h2 style={{ marginBottom: '8px' }}>
                    <TrendingUp size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    Credit Top-Ups
                </h2>
                <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '24px' }}>
                    Buy extra credits that never expire. Use them whenever.
                </p>

                <div className="topup-grid">
                    {TOP_UP_PACKAGES.map((pkg) => (
                        <div
                            key={pkg.id}
                            className={`topup-card ${pkg.popular ? 'topup-card--popular' : ''} ${pkg.best ? 'topup-card--best' : ''}`}
                        >
                            {pkg.popular && <div className="topup-card__badge">Popular</div>}
                            {pkg.best && <div className="topup-card__badge topup-card__badge--best">Best Deal</div>}
                            <div className="topup-card__credits">
                                <Zap size={18} />
                                {pkg.credits}
                            </div>
                            <div className="topup-card__price">{pkg.price}</div>
                            <div className="topup-card__per">{pkg.perCredit}/credit</div>
                            <button
                                className="btn btn--secondary"
                                onClick={() => handleTopUp(pkg.id)}
                            >
                                <CreditCard size={14} /> Buy
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
