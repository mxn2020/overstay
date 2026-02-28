export default function PrivacyPage() {
    return (
        <div className="legal-page">
            <h1>Privacy Policy</h1>
            <p className="legal-page__updated">Last updated: February 2026</p>

            <section className="legal-section">
                <h2>1. Information We Collect</h2>
                <h3>Account Information</h3>
                <p>
                    When you create an account, we collect your email address, name, and password (stored securely hashed).
                </p>
                <h3>Usage Data</h3>
                <p>
                    We collect information about how you use the Service, including photos analyzed, prediction results,
                    credit usage, and feature interactions.
                </p>
                <h3>AI Interaction Data</h3>
                <p>
                    We log AI model interactions (prompts and responses) to monitor quality, debug issues, and
                    improve the prediction experience. These logs do not contain personal information beyond your user ID.
                </p>
                <h3>Photo Data</h3>
                <p>
                    Uploaded photos are temporarily stored for analysis purposes and are automatically deleted after processing.
                    We do not retain your photo content beyond the analysis session unless you explicitly save the result.
                </p>
            </section>

            <section className="legal-section">
                <h2>2. How We Use Your Information</h2>
                <ul>
                    <li>To provide and personalize the prediction experience</li>
                    <li>To track your usage and maintain credit balances</li>
                    <li>To process payments via Stripe</li>
                    <li>To improve our AI models and prediction accuracy</li>
                    <li>To communicate service updates and changes</li>
                </ul>
            </section>

            <section className="legal-section">
                <h2>3. Third-Party Services</h2>
                <p>We use the following third-party services that may process your data:</p>
                <ul>
                    <li><strong>Convex</strong> — Database and backend infrastructure</li>
                    <li><strong>Stripe</strong> — Payment processing</li>
                    <li><strong>NVIDIA / OpenAI</strong> — AI image analysis (Vision Language Models)</li>
                    <li><strong>Vercel</strong> — Hosting and analytics</li>
                    <li><strong>PostHog</strong> — Product analytics</li>
                </ul>
                <p>Each service has its own privacy policy governing data handling.</p>
            </section>

            <section className="legal-section">
                <h2>4. Data Retention</h2>
                <p>
                    Your account data and prediction history are retained as long as your account is active.
                    You may delete your predictions at any time. Upon account deletion, we will remove your
                    personal data within 30 days, except where retention is required by law.
                </p>
            </section>

            <section className="legal-section">
                <h2>5. Data Security</h2>
                <p>
                    We implement industry-standard security measures including encrypted connections (HTTPS),
                    hashed passwords, and secure API key management. However, no method of transmission over
                    the Internet is 100% secure.
                </p>
            </section>

            <section className="legal-section">
                <h2>6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul>
                    <li>Access the personal data we hold about you</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your data</li>
                    <li>Export your data in a portable format</li>
                    <li>Withdraw consent for data processing</li>
                </ul>
            </section>

            <section className="legal-section">
                <h2>7. Cookies</h2>
                <p>
                    We use essential cookies for authentication and session management. We use Vercel Analytics
                    and PostHog for anonymous usage statistics. We do not use advertising cookies or trackers.
                </p>
            </section>

            <section className="legal-section">
                <h2>8. Alcohol-Related Content Disclaimer</h2>
                <p>
                    JustOneLastDrink is an entertainment application. We do not encourage excessive alcohol consumption.
                    The predictions made by our AI are for entertainment purposes only.
                    If you or someone you know struggles with alcohol, please seek help from a qualified professional.
                </p>
            </section>

            <section className="legal-section">
                <h2>9. Children's Privacy</h2>
                <p>
                    The Service is not intended for anyone under the legal drinking age in their jurisdiction.
                    We do not knowingly collect personal information from minors.
                </p>
            </section>

            <section className="legal-section">
                <h2>10. Changes to This Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. We will notify you of material changes
                    via email or through the Service.
                </p>
            </section>

            <section className="legal-section">
                <h2>11. Contact</h2>
                <p>
                    For privacy-related questions, contact us at <strong>privacy@justonelastdrink.app</strong>.
                </p>
            </section>
        </div>
    )
}
