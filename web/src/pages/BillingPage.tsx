import { useQuery, useAction, useConvexAuth } from 'convex/react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { CreditCard, Zap, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

const TOP_UP_PACKAGES = [
    { id: 'topup_40', credits: 40, price: '$1' },
    { id: 'topup_100', credits: 100, price: '$2' },
    { id: 'topup_250', credits: 250, price: '$4' },
]

export default function BillingPage() {
    const { isAuthenticated } = useConvexAuth()
    const subscription = useQuery(api.stripe.getSubscription)
    const balance = useQuery(api.credits.getBalance)
    const transactions = useQuery(api.credits.getTransactionHistory, { limit: 20 })
    const createCheckout = useAction(api.stripe.createCheckoutSession)
    const createTopUp = useAction(api.stripe.createTopUpSession)
    const navigate = useNavigate()

    if (!isAuthenticated) {
        navigate('/login')
        return null
    }

    const currentPlan = subscription?.plan ?? 'free'
    const credits = balance?.credits ?? 0

    const handleSubscribe = async () => {
        try {
            const { url } = await createCheckout({ plan: 'paid' })
            if (url) window.location.href = url
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create checkout')
        }
    }

    const handleTopUp = async (packageId: string) => {
        try {
            const { url } = await createTopUp({ packageId })
            if (url) window.location.href = url
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create checkout')
        }
    }

    return (
        <div className="billing-page">
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
                    <span className="plan-badge plan-badge--lg">{currentPlan.toUpperCase()}</span>
                    <span style={{ color: 'var(--color-smoke-gray)' }}>
                        {currentPlan === 'paid' ? 'Pro subscription active' : 'No active subscription'}
                    </span>
                </div>
                <div className="pricing-balance" style={{ margin: 0 }}>
                    <Zap size={18} />
                    <span>{credits} credits</span>
                </div>
            </div>

            {/* Subscribe / Top-up */}
            <div style={{ marginTop: '32px' }}>
                {currentPlan !== 'paid' && (
                    <div style={{ marginBottom: '24px' }}>
                        <button className="btn btn--primary" onClick={handleSubscribe}>
                            Subscribe — $3/mo (100 credits)
                        </button>
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
