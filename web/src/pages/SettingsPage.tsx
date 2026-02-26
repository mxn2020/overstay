import { useState } from 'react'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { User, Shield, CreditCard, Trash2, Save } from 'lucide-react'

export default function SettingsPage() {
    const { isAuthenticated } = useConvexAuth()
    const { signOut } = useAuthActions()
    const me = useQuery(api.users.getMe)
    const updateProfile = useMutation(api.users.updateProfile)
    const deleteAccount = useMutation(api.users.deleteAccount)
    const navigate = useNavigate()

    const [name, setName] = useState('')
    const [nameLoaded, setNameLoaded] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')
    const [deleting, setDeleting] = useState(false)

    // Load name once
    if (me?.name && !nameLoaded) {
        setName(me.name)
        setNameLoaded(true)
    }

    if (!isAuthenticated || !me) {
        return (
            <div style={{ textAlign: 'center', padding: '64px 16px', color: 'var(--color-smoke-gray)' }}>
                Loading...
            </div>
        )
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateProfile({ name })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error('Failed to update profile:', err)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (deleteConfirmText !== 'DELETE') return
        setDeleting(true)
        try {
            await deleteAccount({})
            await signOut()
            navigate('/')
        } catch (err) {
            console.error('Failed to delete account:', err)
            setDeleting(false)
        }
    }

    return (
        <div className="settings-page">
            <h1 style={{ marginBottom: '8px' }}>⚙️ Settings</h1>
            <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '32px' }}>
                Manage your account. Or delete it. We won't judge.
            </p>

            {/* Profile Section */}
            <div className="settings-section">
                <div className="settings-section__header">
                    <User size={20} />
                    <h2>Profile</h2>
                </div>
                <div className="settings-section__body">
                    <div className="settings-field">
                        <label className="settings-field__label">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSaved(false); }}
                            className="settings-field__input"
                            placeholder="Your name"
                        />
                    </div>
                    <div className="settings-field">
                        <label className="settings-field__label">Email</label>
                        <input
                            type="email"
                            value={me.email ?? ''}
                            className="settings-field__input"
                            disabled
                        />
                        <span className="settings-field__hint">Email cannot be changed</span>
                    </div>
                    <button
                        className="btn btn--primary"
                        onClick={handleSave}
                        disabled={saving || saved}
                        style={{ marginTop: '8px' }}
                    >
                        {saved ? '✅ Saved' : saving ? '⏳ Saving...' : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>
            </div>

            {/* Plan Section */}
            <div className="settings-section">
                <div className="settings-section__header">
                    <Shield size={20} />
                    <h2>Plan</h2>
                </div>
                <div className="settings-section__body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span className="plan-badge">{(me.plan ?? 'free').toUpperCase()}</span>
                        <span style={{ color: 'var(--color-smoke-gray)' }}>
                            {me.plan === 'pro' ? 'Unlimited predictions + Premium cards' :
                                me.plan === 'enterprise' ? 'Everything + API access' :
                                    '3 predictions per day'}
                        </span>
                    </div>
                    <Link to="/billing" className="btn btn--secondary">
                        <CreditCard size={16} /> Manage Billing
                    </Link>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section settings-section--danger">
                <div className="settings-section__header">
                    <Trash2 size={20} />
                    <h2>Danger Zone</h2>
                </div>
                <div className="settings-section__body">
                    <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '16px' }}>
                        Permanently delete your account, predictions, and badges. This action cannot be undone.
                    </p>
                    {!showDeleteConfirm ? (
                        <button
                            className="btn btn--danger"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 size={16} /> Delete Account
                        </button>
                    ) : (
                        <div className="delete-confirm">
                            <p style={{ color: '#EF4444', fontWeight: 600, marginBottom: '12px' }}>
                                Type "DELETE" to confirm:
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="settings-field__input"
                                placeholder='Type "DELETE"'
                                style={{ marginBottom: '12px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn--danger"
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                                >
                                    {deleting ? '⏳ Deleting...' : '🗑️ Permanently Delete'}
                                </button>
                                <button
                                    className="btn btn--secondary"
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
