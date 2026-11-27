import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { formatDateTime, formatPhone, onlyDigits } from '../utils/format'
import './Auth.css'
import './Profile.css'

const consentLabels = {
  terms: 'Termos de Uso e Política de Privacidade',
  loyalty: 'Programa de fidelidade',
  marketing: 'Promoções personalizadas',
}

const optionalConsents = [
  {
    key: 'loyalty',
    title: 'Programa de fidelidade',
    description: 'Usamos seu histórico de pedidos para acumular pontos e liberar descontos.',
  },
  {
    key: 'marketing',
    title: 'Promoções personalizadas',
    description: 'Ofertas por e-mail e no app com base nas suas preferências e frequência de consumo.',
  },
]

function ProfileData({ user, onSave }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(formatPhone(user.phone ?? ''))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function startEditing() {
    setName(user.name)
    setPhone(formatPhone(user.phone ?? ''))
    setError('')
    setSaved(false)
    setEditing(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const digits = onlyDigits(phone)
    if (name.trim().length < 3) {
      setError('Informe seu nome completo.')
      return
    }
    if (digits && digits.length < 10) {
      setError('Celular incompleto.')
      return
    }

    setError('')
    setSaving(true)
    try {
      await onSave({ name, phone: digits })
      setEditing(false)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card profile-card">
      <div className="profile-card-header">
        <h2>Seus dados</h2>
        {!editing && (
          <button className="btn-link" onClick={startEditing}>
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <form className="auth-form profile-form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="profile-name">Nome completo</label>
            <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div className="field">
            <label htmlFor="profile-phone">
              Celular <span className="optional">(opcional)</span>
            </label>
            <input
              id="profile-phone"
              inputMode="numeric"
              placeholder="(81) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              autoComplete="tel"
            />
          </div>
          <div className="field">
            <label htmlFor="profile-email">E-mail</label>
            <input id="profile-email" value={user.email} disabled />
            <small className="muted">Para trocar o e-mail, fale com privacidade@raizesdonordeste.com.br.</small>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="profile-actions">
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(false)} disabled={saving}>
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          <dl className="detail-info">
            <dt>Nome</dt>
            <dd>{user.name}</dd>
            <dt>E-mail</dt>
            <dd>{user.email}</dd>
            <dt>Celular</dt>
            <dd>{user.phone ? formatPhone(user.phone) : 'Não informado'}</dd>
            <dt>Cliente desde</dt>
            <dd>{formatDateTime(user.createdAt)}</dd>
          </dl>
          {saved && <p className="profile-success">Dados atualizados.</p>}
        </>
      )}
    </div>
  )
}

function ConsentSettings({ user, onSave }) {
  const [choices, setChoices] = useState({
    loyalty: !!user.consents.loyalty?.accepted,
    marketing: !!user.consents.marketing?.accepted,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const dirty = optionalConsents.some(({ key }) => choices[key] !== !!user.consents[key]?.accepted)
  const history = [...user.consentHistory].reverse()

  function toggle(key) {
    setChoices((prev) => ({ ...prev, [key]: !prev[key] }))
    setMessage('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await onSave(choices)
      setMessage('Preferências salvas.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card profile-card">
      <h2>Privacidade e consentimentos</h2>
      <p className="muted profile-intro">
        Você decide como usamos seus dados. Revogar um consentimento não afeta pedidos já feitos.
      </p>

      <ul className="consent-settings">
        <li className="consent-setting">
          <div>
            <strong>{consentLabels.terms}</strong>
            <small className="muted">
              Necessário para manter a conta. Aceito em {formatDateTime(user.consents.terms?.at)}.
            </small>
          </div>
          <span className="tag tag-status-neutral">Obrigatório</span>
        </li>

        {optionalConsents.map(({ key, title, description }) => (
          <li key={key} className="consent-setting">
            <div>
              <strong>{title}</strong>
              <small className="muted">{description}</small>
              <small className="consent-updated">
                {user.consents[key]?.accepted ? 'Autorizado' : 'Não autorizado'} em{' '}
                {formatDateTime(user.consents[key]?.at)}
              </small>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                role="switch"
                checked={choices[key]}
                onChange={() => toggle(key)}
                aria-label={title}
              />
              <span className="switch-track" aria-hidden="true" />
            </label>
          </li>
        ))}
      </ul>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {message && !dirty && <p className="profile-success">{message}</p>}

      <button className="btn" onClick={handleSave} disabled={!dirty || saving}>
        {saving ? 'Salvando...' : 'Salvar preferências'}
      </button>

      <details className="consent-history">
        <summary>Histórico de alterações ({history.length})</summary>
        <ul>
          {history.map((entry, index) => (
            <li key={index}>
              <span>{formatDateTime(entry.at)}</span>
              <span>
                {consentLabels[entry.type]}: <strong>{entry.accepted ? 'autorizado' : 'não autorizado'}</strong>
              </span>
            </li>
          ))}
        </ul>
      </details>

      <p className="muted profile-note">
        Saiba como usamos seus dados na <Link to="/privacidade">Política de Privacidade</Link>.
      </p>
    </div>
  )
}

function DataRights({ onExport, onDelete }) {
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    setExporting(true)
    setExportMessage('')
    try {
      const data = await onExport()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `meus-dados-raizes-${data.exportedAt.slice(0, 10)}.json`
      link.click()
      URL.revokeObjectURL(url)
      setExportMessage(`Arquivo gerado com ${data.orders.length} pedido(s).`)
    } catch (err) {
      setExportMessage(err.message)
    } finally {
      setExporting(false)
    }
  }

  function cancelDelete() {
    setConfirming(false)
    setPassword('')
    setError('')
  }

  async function handleDelete(e) {
    e.preventDefault()
    if (!password) {
      setError('Digite sua senha para confirmar.')
      return
    }
    setError('')
    setDeleting(true)
    try {
      await onDelete(password)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="card profile-card">
      <h2>Seus direitos (LGPD)</h2>

      <div className="right-item">
        <div>
          <strong>Baixar meus dados</strong>
          <small className="muted">Cópia da sua conta, consentimentos e pedidos em formato JSON (portabilidade).</small>
          {exportMessage && <small className="profile-success">{exportMessage}</small>}
        </div>
        <button className="btn btn-outline btn-small" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Gerando...' : 'Baixar'}
        </button>
      </div>

      <div className="right-item">
        <div>
          <strong>Excluir minha conta</strong>
          <small className="muted">Apaga seus dados pessoais. Esta ação não pode ser desfeita.</small>
        </div>
        {!confirming && (
          <button className="btn btn-danger btn-small" onClick={() => setConfirming(true)}>
            Excluir
          </button>
        )}
      </div>

      {confirming && (
        <form className="auth-form danger-zone" onSubmit={handleDelete} noValidate>
          <p>
            <strong>Tem certeza?</strong> Ao excluir a conta:
          </p>
          <ul>
            <li>seu nome, e-mail, celular e data de nascimento são apagados;</li>
            <li>seus pontos de fidelidade são perdidos;</li>
            <li>os pedidos ficam anonimizados, guardados só para fins fiscais.</li>
          </ul>
          <div className="field">
            <label htmlFor="delete-password">Digite sua senha para confirmar</label>
            <input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!error}
            />
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="profile-actions">
            <button type="submit" className="btn btn-danger" disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </button>
            <button type="button" className="btn btn-outline" onClick={cancelDelete} disabled={deleting}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function Profile() {
  const { user, logout, updateProfile, updateConsents, exportData, deleteAccount } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  if (!user) {
    return (
      <section>
        <h1>Perfil</h1>
        {location.state?.accountDeleted && (
          <div className="card profile-deleted" role="status">
            <strong>Sua conta foi excluída.</strong>
            <p className="muted">Seus dados pessoais foram apagados e seus pedidos anonimizados.</p>
          </div>
        )}
        <div className="card empty-state">
          <p>Entre na sua conta para ver seus dados, pontos de fidelidade e preferências de privacidade.</p>
          <div className="profile-actions">
            <Link to="/entrar" className="btn">
              Entrar
            </Link>
            <Link to="/cadastro" className="btn btn-outline">
              Criar conta
            </Link>
          </div>
        </div>
      </section>
    )
  }

  function handleLogout() {
    logout()
    navigate('/')
  }

  async function handleDelete(password) {
    await deleteAccount(password)
    navigate('/perfil', { replace: true, state: { accountDeleted: true } })
  }

  return (
    <section className="profile-page">
      <h1>Olá, {user.name.split(' ')[0]}!</h1>

      <ProfileData user={user} onSave={updateProfile} />
      <Link to="/fidelidade" className="card profile-loyalty-link">
        <span>
          <strong>⭐ Raízes+ Fidelidade</strong>
          <small className="muted">
            {user.consents.loyalty?.accepted ? 'Veja seus pontos, nível e recompensas' : 'Você ainda não participa. Saiba mais'}
          </small>
        </span>
        <span aria-hidden="true">›</span>
      </Link>
      <ConsentSettings user={user} onSave={updateConsents} />
      <DataRights onExport={exportData} onDelete={handleDelete} />

      <button className="btn btn-outline" onClick={handleLogout}>
        Sair da conta
      </button>
    </section>
  )
}
