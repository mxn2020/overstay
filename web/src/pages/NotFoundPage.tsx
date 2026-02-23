interface NotFoundPageProps {
    onGoHome: () => void
}

export default function NotFoundPage({ onGoHome }: NotFoundPageProps) {
    return (
        <div className="not-found">
            <div className="not-found__code">404</div>
            <p className="not-found__text">
                Your plans went missing. Just like your intention to leave early.
            </p>
            <button className="btn btn--primary" onClick={onGoHome}>
                🏠 Go Home (While You Still Can)
            </button>
        </div>
    )
}
