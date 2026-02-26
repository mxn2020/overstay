import { useQuery, useAction, useConvexAuth } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { CreditCard, Check, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function BillingPage() {
    const { isAuthenticated } = useConvexAuth()
    const subscription = useQuery(api.stripe.getSubscription)
    const createCheckout = useAction(api.stripe.createCheckoutSession)
    const navigate = useNavigate()

    if (!isAuthenticated) {
        navigate('/login')
        return null
    }

    const currentPlan = subscription?.plan ?? 'free'

    const handleUpgrade = async (plan: 'pro' | 'enterprise') => {
        try {
            const { url } = await createCheckout({ plan })
            if (url) window.location.href = url
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create checkout')
        }
    }

    const plans = [
        {
            id: 'free' as const,
            name: 'Free',
            price: '$0',
            features: [
                '3 predictions per day',
                'Basic analysis',
                'Share predictions',
            ],
            missing: ['History tracking', 'Beat the AI mode'],
        },
        {
            id: 'pro' as const,
            name: 'Pro',
            price: '$9/mo',
            popular: true,
            features: [
                'Unlimited predictions',
                'Advanced analysis',
                'Full history',
                'Beat the AI mode',
                'Priority support',
            ],
            missing: [],
        },
        {
            id: 'enterprise' as const,
            name: 'Enterprise',
            price: '$29/mo',
            features: [
                'Everything in Pro',
                'API access',
                'Custom branding',
                'Team management',
                'SLA support',
            ],
            missing: [],
        },
    ]

    return (
        <div className="billing-page">
            <div style={{ marginBottom: '32px' }}>
                <Link to="/settings" className="btn btn--ghost" style={{ marginBottom: '16px', display: 'inline-flex' }}>
                    <ArrowLeft size={16} /> Back to Settings
                </Link>
                <h1><CreditCard size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Billing & Subscription</h1>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: '8px' }}>
                    Manage your subscription. Your wallet will thank you. Or not.
                </p>
            </div>

            {/* Current Plan Banner */}
            <div className="billing-current">
                <div className="billing-current__info">
                    <span className="plan-badge plan-badge--lg">{currentPlan.toUpperCase()}</span>
                    <span style={{ color: 'var(--color-smoke-gray)' }}>
                        {currentPlan === 'free' ? 'You are on the free plan' : `Your ${currentPlan} subscription is active`}
                    </span>
                </div>
            </div>

            {/* Plan Cards */}
            <div className="pricing-grid" style={{ marginTop: '32px' }}>
                {plans.map((plan) => (
                    <div key={plan.id} className={`pricing-card ${plan.popular ? 'pricing-card--popular' : ''}`}>
                        {plan.popular && <div className="pricing-card__badge">Most Popular</div>}
                        <div className="pricing-card__header">
                            <h2>{plan.name}</h2>
                            <div className="pricing-card__price">{plan.price}</div>
                        </div>
                        <ul className="pricing-card__features">
                            {plan.features.map((f) => (
                                <li key={f}><Check size={16} style={{ color: 'var(--color-neon-emerald, #10B981)' }} /> {f}</li>
                            ))}
                            {plan.missing.map((f) => (
                                <li key={f} style={{ opacity: 0.5 }}>✕ {f}</li>
                            ))}
                        </ul>
                        {currentPlan === plan.id ? (
                            <button className="btn btn--secondary pricing-card__btn" disabled>
                                ✅ Current Plan
                            </button>
                        ) : plan.id === 'free' ? (
                            <button className="btn btn--secondary pricing-card__btn" disabled>
                                Free Tier
                            </button>
                        ) : (
                            <button
                                className="btn btn--primary pricing-card__btn"
                                onClick={() => handleUpgrade(plan.id as 'pro' | 'enterprise')}
                            >
                                Upgrade to {plan.name}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
