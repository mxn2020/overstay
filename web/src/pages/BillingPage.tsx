import { useQuery, useAction, useConvexAuth } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { CreditCard, Zap, ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useToast } from '../components/Toast'
import { useState, useEffect } from 'react'
import { MissingConfigDialog } from '../components/MissingConfigDialog'

const TOP_UP_PACKAGES = [
    { id: 'topup_40', credits: 40, price: '$1' },
    { id: 'topup_100', credits: 100, price: '$2' },
    { id: 'topup_250', credits: 250, price: '$4' },
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

export default function BillingPage() {
    const { isAuthenticated } = useConvexAuth()
    const { showToast } = useToast()
    const subscription = useQuery(api.stripe.getSubscription)
    const balance = useQuery(api.credits.getBalance)
    const transactions = useQuery(api.credits.getTransactionHistory, { limit: 20 })
    const getActivePlans = useAction(api.stripe.getActivePlans)
    const createCheckout = useAction(api.stripe.createCheckoutSession)
    const createTopUp = useAction(api.stripe.createTopUpSession)
    const createPortal = useAction(api.stripe.createPortalSession)
    const navigate = useNavigate()

    const [configError, setConfigError] = useState<string | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) return

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
    }, [isAuthenticated, getActivePlans])

    if (!isAuthenticated) {
        navigate('/login')
        return null
    }

    const currentPlan = subscription?.plan ?? 'free'
    const credits = balance?.credits ?? 0
    const hasStripeCustomer = !!subscription?.stripeCustomerId

    const handleSubscribe = async (planKey: string, priceId: string) => {
        try {
            const { url } = await createCheckout({ planKey, priceId })
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
        try {
            const { url } = await createTopUp({ packageId })
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

    const handleManageSubscription = async () => {
        try {
            const { url } = await createPortal()
            if (url) window.location.assign(url)
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to open billing portal'
            if (msg.includes('not configured')) {
                setConfigError(msg)
            } else {
                showToast(msg, 'error')
            }
        }
    }

    return (
        <div className="billing-page">
            {configError && (
                <MissingConfigDialog
                    message={configError}
                    onClose={() => setConfigError(null)}
                />
            )}
            <div style={{ marginBottom: '32px' }}>
                <Link to="/settings" className="btn btn--ghost" style={{ marginBottom: '16px', display: 'inline-flex' }}>
                    <ArrowLeft size={16} /> Back to Settings
                </Link>
                <h1><CreditCard size={28} style={{ verticalAlign: 'middle', marginRight: '8px' }} />Billing & Credits</h1>
                <p style={{ color: 'var(--color-smoke-gray)', marginTop: '8px' }}>
                    Manage your subscription and credits.
                </p>
            </div>

            {/* Current Plan + Credits */}
            <div className="billing-current">
                <div className="billing-current__info">
                    <span className="plan-badge plan-badge--lg">
                        {currentPlan.toUpperCase()}
                    </span>
                    <span style={{ color: 'var(--color-smoke-gray)' }}>
                        {currentPlan === 'paid' ? '🍻 Subscription active' : 'No active subscription'}
                    </span>
                </div>
                <div className="pricing-balance" style={{ margin: 0 }}>
                    <Zap size={18} />
                    <span>{credits} credits</span>
                </div>
            </div>

            {/* Subscribe / Manage / Top-up */}
            <div style={{ marginTop: '32px' }}>
                {loadingPlans ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
                        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                    </div>
                ) : (
                    currentPlan !== 'paid' && plans.map(plan => (
                        <div key={plan.id} style={{ marginBottom: '24px' }}>
                            <button className="btn btn--primary" onClick={() => handleSubscribe(plan.planKey, plan.price!.id)}>
                                Wait, Subscribe to {plan.name} — ${plan.price ? (plan.price.amount / 100).toFixed(0) : '0'}/mo
                            </button>
                        </div>
                    ))
                )}

                {hasStripeCustomer && (
                    <div style={{ marginBottom: '24px' }}>
                        <button className="btn btn--secondary" onClick={handleManageSubscription}>
                            <ExternalLink size={14} style={{ marginRight: '6px' }} />
                            Manage Subscription & Payment
                        </button>
                        <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.8rem', marginTop: '6px' }}>
                            Update payment method, view invoices, or cancel subscription via Stripe.
                        </p>
                    </div>
                )}

                <h3 style={{ marginBottom: '12px' }}>⚡ Top-up Credits</h3>
                <div className="topup-grid">
                    {TOP_UP_PACKAGES.map((pkg) => (
                        <div key={pkg.id} className="topup-card">
                            <div className="topup-card__credits">
                                <Zap size={16} />{pkg.credits}
                            </div>
                            <div className="topup-card__price">{pkg.price}</div>
                            <button className="btn btn--secondary" onClick={() => handleTopUp(pkg.id)}>
                                Buy
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transaction History */}
            {transactions && transactions.length > 0 && (
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ marginBottom: '12px' }}>📋 Recent Transactions</h3>
                    <div style={{ display: 'grid', gap: '8px' }}>
                        {transactions.map((tx) => (
                            <div key={tx._id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '10px 14px',
                                background: 'var(--glass-background, rgba(255,255,255,0.05))',
                                border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
                                borderRadius: '8px', fontSize: '0.85rem',
                            }}>
                                <div>
                                    <span style={{
                                        padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600,
                                        marginRight: '8px',
                                        background: tx.type === 'deduct' ? 'rgba(239,68,68,0.2)' :
                                            tx.type === 'purchase' ? 'rgba(16,185,129,0.2)' :
                                                tx.type === 'refill' ? 'rgba(59,130,246,0.2)' : 'rgba(255,215,0,0.2)',
                                        color: tx.type === 'deduct' ? '#ef4444' :
                                            tx.type === 'purchase' ? '#10B981' :
                                                tx.type === 'refill' ? '#3b82f6' : '#ffd700',
                                    }}>{tx.type.toUpperCase()}</span>
                                    {tx.description}
                                </div>
                                <span style={{
                                    fontWeight: 600,
                                    color: tx.amount > 0 ? '#10B981' : '#ef4444',
                                }}>
                                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
