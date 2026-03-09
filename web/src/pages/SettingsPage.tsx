import { useState } from 'react'
import { logger } from '../lib/logger'
import { useQuery, useMutation, useConvexAuth } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useNavigate, Link } from 'react-router-dom'
import { api } from '../../convex/_generated/api'
import { User, Shield, CreditCard, Trash2, Save } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@geenius-ui/react-css'

export default function SettingsPage() {
    const { t } = useTranslation()
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
                {t('common.loading')}
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
            logger.error('Failed to update profile:', err)
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
            logger.error('Failed to delete account:', err)
            setDeleting(false)
        }
    }

    return (
        <div className="settings-page">
            <h1 style={{ marginBottom: '8px' }}>⚙️ {t('settings.title')}</h1>
            <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '32px' }}>
                {t('settings.subtitle')}
            </p>

            {/* Profile Section */}
            <div className="settings-section">
                <div className="settings-section__header">
                    <User size={20} />
                    <h2>{t('settings.profile')}</h2>
                </div>
                <div className="settings-section__body">
                    <div className="settings-field">
                        <Input
                            label={t('settings.displayName')}
                            type="text"
                            value={name}
                            onChange={(e) => { setName(e.target.value); setSaved(false); }}
                            placeholder={t('settings.displayName')}
                        />
                    </div>
                    <div className="settings-field">
                        <Input
                            label={t('settings.email')}
                            type="email"
                            value={me.email ?? ''}
                            disabled
                        />
                        <span className="settings-field__hint">{t('settings.emailHint')}</span>
                    </div>
                    <button
                        className="btn btn--primary"
                        onClick={handleSave}
                        disabled={saving || saved}
                        style={{ marginTop: '8px' }}
                    >
                        {saved ? `✅ ${t('settings.saved')}` : saving ? `⏳ ${t('settings.saving')}` : <><Save size={16} /> {t('settings.saveChanges')}</>}
                    </button>
                </div>
            </div>

            {/* Plan & Credits Section */}
            <div className="settings-section">
                <div className="settings-section__header">
                    <Shield size={20} />
                    <h2>{t('settings.plan')}</h2>
                </div>
                <div className="settings-section__body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span className="plan-badge">{me.plan === 'paid' ? "LET'S HAVE FUN" : 'FREE'}</span>
                        <span style={{ color: 'var(--color-smoke-gray)' }}>
                            {me.plan === 'paid' ? '🍻 100 credits/month + top-ups' : t('settings.freePlan')}
                        </span>
                    </div>

                    {/* Credit Balance */}
                    <div style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginBottom: '16px',
                        border: '1px solid rgba(255,255,255,0.06)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-smoke-gray)' }}>Credits Available</span>
                            <span style={{
                                fontSize: '1.5rem',
                                fontWeight: '800',
                                color: (me.creditBalance ?? 0) > 0 ? 'var(--color-neon-amber)' : 'var(--color-hot-red)',
                            }}>
                                {me.creditBalance ?? 0}
                            </span>
                        </div>
                        <div style={{
                            height: '6px',
                            borderRadius: '3px',
                            background: 'rgba(255,255,255,0.06)',
                            overflow: 'hidden',
                        }}>
                            <div style={{
                                height: '100%',
                                width: `${Math.min(100, ((me.creditBalance ?? 0) / 100) * 100)}%`,
                                borderRadius: '3px',
                                background: (me.creditBalance ?? 0) > 20
                                    ? 'linear-gradient(90deg, var(--color-neon-amber), var(--color-neon-orange))'
                                    : 'var(--color-hot-red)',
                                transition: 'width 0.5s ease',
                            }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-smoke-gray)', opacity: 0.6 }}>
                                4 credits per prediction
                            </span>
                            <Link to="/pricing" style={{ fontSize: '0.75rem', color: 'var(--color-neon-amber)', textDecoration: 'none' }}>
                                + Top up credits
                            </Link>
                        </div>
                    </div>

                    <Link to="/billing" className="btn btn--secondary">
                        <CreditCard size={16} /> {t('settings.manageBilling')}
                    </Link>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section settings-section--danger">
                <div className="settings-section__header">
                    <Trash2 size={20} />
                    <h2>{t('settings.dangerZone')}</h2>
                </div>
                <div className="settings-section__body">
                    <p style={{ color: 'var(--color-smoke-gray)', marginBottom: '16px' }}>
                        {t('settings.deleteWarning')}
                    </p>
                    {!showDeleteConfirm ? (
                        <button
                            className="btn btn--danger"
                            onClick={() => setShowDeleteConfirm(true)}
                        >
                            <Trash2 size={16} /> {t('settings.deleteAccount')}
                        </button>
                    ) : (
                        <div className="delete-confirm">
                            <p style={{ color: '#EF4444', fontWeight: 600, marginBottom: '12px' }}>
                                {t('settings.typeDelete')}
                            </p>
                            <Input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder='Type "DELETE"'
                                style={{ marginBottom: '12px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    className="btn btn--danger"
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== 'DELETE' || deleting}
                                >
                                    {deleting ? `⏳ ${t('common.loading')}` : `🗑️ ${t('settings.permanentlyDelete')}`}
                                </button>
                                <button
                                    className="btn btn--secondary"
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                                >
                                    {t('settings.cancel')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
