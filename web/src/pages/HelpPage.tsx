import { useState } from 'react'

const FAQ_ITEMS = [
    {
        q: "How does the AI prediction work?",
        a: "Our AI analyzes your nightlife photos using advanced computer vision to detect the vibe, chaos level, and environmental cues, then predicts when you'll actually leave."
    },
    {
        q: "Is my data private?",
        a: "Yes! Photos are processed in real-time and never stored permanently. Predictions are saved only if you have an account and choose to keep them."
    },
    {
        q: "Can I use this without creating an account?",
        a: "Absolutely! The free tier lets you make predictions without signing up. Create an account to save your history and unlock advanced features."
    },
    {
        q: "How accurate are the predictions?",
        a: "Our AI is eerily accurate for entertainment purposes. It analyzes patterns that correlate with longer nights out — but remember, you can always prove it wrong!"
    },
    {
        q: "How do I cancel my subscription?",
        a: "Go to your Profile page and click 'Manage Subscription'. You can cancel anytime and keep access until the end of your billing period."
    },
]

export default function HelpPage() {
    const [openIdx, setOpenIdx] = useState<number | null>(null)

    return (
        <div className="help-page">
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl, 48px)' }}>
                <h1>❓ Help Center</h1>
                <p style={{ color: 'var(--color-smoke-gray, #999)', fontSize: '1.1rem', marginTop: '8px' }}>
                    Got questions? We've got answers.
                </p>
            </div>

            <div className="faq-list">
                {FAQ_ITEMS.map((item, i) => (
                    <div
                        key={i}
                        className={`faq-item ${openIdx === i ? 'faq-item--open' : ''}`}
                        onClick={() => setOpenIdx(openIdx === i ? null : i)}
                    >
                        <div className="faq-item__question">
                            <span>{item.q}</span>
                            <span className="faq-item__icon">{openIdx === i ? '−' : '+'}</span>
                        </div>
                        {openIdx === i && (
                            <div className="faq-item__answer">{item.a}</div>
                        )}
                    </div>
                ))}
            </div>

            <div className="help-contact" style={{ textAlign: 'center', marginTop: 'var(--space-2xl, 48px)' }}>
                <h2>Still need help?</h2>
                <p style={{ color: 'var(--color-smoke-gray, #999)', marginTop: '8px', marginBottom: '16px' }}>
                    Reach out to us and we'll get back to you ASAP.
                </p>
                <a href="mailto:support@justonelastdrink.com" className="btn btn--primary">
                    📧 Contact Support
                </a>
            </div>
        </div>
    )
}
