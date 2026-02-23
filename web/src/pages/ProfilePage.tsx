export default function ProfilePage() {
    // In the full version, this would use Convex auth + queries
    // For MVP, show a placeholder encouraging sign-up

    return (
        <div className="profile">
            <div style={{ textAlign: 'center', padding: '64px 16px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔮</div>
                <h2 style={{ marginBottom: '12px' }}>Your Night, Tracked</h2>
                <p style={{ color: 'var(--color-smoke-gray)', maxWidth: '400px', margin: '0 auto 32px' }}>
                    Sign up to save your predictions, track your chaos score over time,
                    earn badges, and compete with friends in Beat the AI.
                </p>

                {/* Demo stats to show what they'd get */}
                <div className="profile__stats-grid" style={{ marginBottom: '32px' }}>
                    <div className="profile__stat-card">
                        <div className="profile__stat-value">—</div>
                        <div className="profile__stat-label">Overstay Score</div>
                    </div>
                    <div className="profile__stat-card">
                        <div className="profile__stat-value">0</div>
                        <div className="profile__stat-label">Predictions</div>
                    </div>
                    <div className="profile__stat-card">
                        <div className="profile__stat-value">0</div>
                        <div className="profile__stat-label">AI Beaten</div>
                    </div>
                    <div className="profile__stat-card">
                        <div className="profile__stat-value">0</div>
                        <div className="profile__stat-label">Streak</div>
                    </div>
                </div>

                <h3 style={{ marginBottom: '16px' }}>🏅 Badges</h3>
                <div className="badges" style={{ justifyContent: 'center', marginBottom: '32px' }}>
                    <span className="badge" style={{ opacity: 0.4 }}>🏃 Early Escape</span>
                    <span className="badge" style={{ opacity: 0.4 }}>⏰ On the Dot</span>
                    <span className="badge" style={{ opacity: 0.4 }}>🌅 Sunrise Survivor</span>
                    <span className="badge" style={{ opacity: 0.4 }}>🔮 AI's Pet</span>
                    <span className="badge" style={{ opacity: 0.4 }}>💪 Unbeatable</span>
                    <span className="badge" style={{ opacity: 0.4 }}>👻 Ghost</span>
                </div>

                <p style={{ color: 'var(--color-smoke-gray)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                    Authentication coming soon — for now, just enjoy the predictions.
                </p>
            </div>
        </div>
    )
}
