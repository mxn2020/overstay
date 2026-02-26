import { useQuery } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Zap } from 'lucide-react'

export default function CreditsBadge() {
    const { isAuthenticated } = useConvexAuth()
    const balance = useQuery(api.credits.getBalance)

    if (!isAuthenticated || !balance) return null

    return (
        <div className="credits-badge" title={`${balance.credits} credits remaining`}>
            <Zap size={14} />
            <span className="credits-badge__count">{balance.credits}</span>
            {balance.plan === 'paid' && (
                <span className="credits-badge__plan">PRO</span>
            )}
        </div>
    )
}
