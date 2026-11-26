import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { formatDateTime } from '../utils/format'

const consentLabels = {
  terms: 'Termos de Uso e Política de Privacidade',
  loyalty: 'Programa de fidelidade',
  marketing: 'Promoções personalizadas',
}

export default function Profile() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <section>
        <h1>Perfil</h1>
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

  return (
    <section>
      <h1>Olá, {user.name.split(' ')[0]}!</h1>

      <div className="card profile-card">
        <h2>Seus dados</h2>
        <dl className="detail-info">
          <dt>Nome</dt>
          <dd>{user.name}</dd>
          <dt>E-mail</dt>
          <dd>{user.email}</dd>
          <dt>Cliente desde</dt>
          <dd>{formatDateTime(user.createdAt)}</dd>
        </dl>
      </div>

      <div className="card profile-card">
        <h2>Consentimentos</h2>
        <ul className="consent-summary">
          {Object.entries(consentLabels).map(([key, label]) => (
            <li key={key}>
              <span>{label}</span>
              <span className={`tag ${user.consents[key]?.accepted ? 'tag-status-success' : 'tag-status-neutral'}`}>
                {user.consents[key]?.accepted ? 'Autorizado' : 'Não autorizado'}
              </span>
            </li>
          ))}
        </ul>
        <p className="muted profile-note">
          Saiba como usamos seus dados na <Link to="/privacidade">Política de Privacidade</Link>.
        </p>
      </div>

      <button className="btn btn-outline" onClick={handleLogout}>
        Sair da conta
      </button>
    </section>
  )
}
