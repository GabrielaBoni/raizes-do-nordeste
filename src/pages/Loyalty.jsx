import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { loyaltyRewards, loyaltyTiers } from '../data/promotions'
import { fetchLoyaltyAccount, getNextTier, getTier, isBirthdayMonth, isLoyaltyMember } from '../services/loyaltyService'
import { formatDateTime, formatPrice } from '../utils/format'
import './Loyalty.css'

function HowItWorks() {
  return (
    <div className="card loyalty-section">
      <h2>Como funciona</h2>
      <ol className="loyalty-steps">
        <li>
          <strong>Peça e acumule.</strong> Cada R$ 1 pago vira 1 ponto. No mês do seu aniversário, os pontos valem em
          dobro.
        </li>
        <li>
          <strong>Suba de nível.</strong> Quanto mais você pede, maior o seu nível e mais pontos ganha por real.
        </li>
        <li>
          <strong>Troque por desconto.</strong> Use os pontos no checkout. Quanto mais pontos, maior o desconto.
        </li>
      </ol>

      <div className="loyalty-tables">
        <div>
          <h3>Níveis</h3>
          <ul className="loyalty-list">
            {loyaltyTiers.map((tier) => (
              <li key={tier.id}>
                <span>
                  <strong>{tier.name}</strong>
                  <small className="muted">a partir de {tier.minPoints} pontos acumulados</small>
                </span>
                <span className="tag tag-promo">{tier.multiplier}x pontos</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Recompensas</h3>
          <ul className="loyalty-list">
            {loyaltyRewards.map((reward) => (
              <li key={reward.id}>
                <span>
                  <strong>{reward.points} pontos</strong>
                </span>
                <span className="tag tag-status-success">{formatPrice(reward.value)} de desconto</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function JoinProgram({ onJoin }) {
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    setJoining(true)
    setError('')
    try {
      await onJoin()
    } catch (err) {
      setError(err.message)
      setJoining(false)
    }
  }

  return (
    <div className="card loyalty-join">
      <h2>Participe do programa</h2>
      <p>
        Para acumular pontos, precisamos da sua autorização para usar o <strong>histórico dos seus pedidos</strong>{' '}
        (valores, datas e produtos) e, se informada, a sua <strong>data de nascimento</strong>.
      </p>
      <p className="muted">
        Você pode sair do programa quando quiser no seu perfil. Seus pedidos continuam funcionando normalmente.
      </p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn" onClick={handleJoin} disabled={joining}>
        {joining ? 'Ativando...' : 'Autorizar e participar'}
      </button>
    </div>
  )
}

function MemberArea({ user }) {
  const [account, setAccount] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchLoyaltyAccount(user.id)
      .then((data) => {
        if (active) setAccount(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar seus pontos.')
      })
    return () => {
      active = false
    }
  }, [user.id])

  if (error) return <p className="form-error">{error}</p>
  if (!account) return <p className="muted">Carregando seus pontos...</p>

  const tier = getTier(account.lifetime)
  const nextTier = getNextTier(account.lifetime)
  const progress = nextTier
    ? ((account.lifetime - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100
    : 100
  const history = [...account.history].reverse()

  return (
    <>
      <div className="card loyalty-balance">
        <div className="balance-main">
          <span className="muted">Seu saldo</span>
          <strong className="balance-points">{account.points}</strong>
          <span>pontos</span>
        </div>
        <div className="balance-tier">
          <span className={`tier-badge tier-${tier.id}`}>Nível {tier.name}</span>
          <div className="tier-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <small className="muted">
            {nextTier
              ? `Faltam ${nextTier.minPoints - account.lifetime} pontos para o nível ${nextTier.name} (${nextTier.multiplier}x pontos).`
              : 'Você está no nível máximo!'}
          </small>
        </div>
        {isBirthdayMonth(user) && <p className="birthday-note">🎂 Feliz aniversário! Seus pontos valem em dobro este mês.</p>}
      </div>

      <div className="card loyalty-section">
        <h2>Recompensas</h2>
        <ul className="loyalty-list">
          {loyaltyRewards.map((reward) => {
            const missing = reward.points - account.points
            return (
              <li key={reward.id}>
                <span>
                  <strong>{formatPrice(reward.value)} de desconto</strong>
                  <small className="muted">{reward.points} pontos</small>
                </span>
                {missing <= 0 ? (
                  <span className="tag tag-status-success">Disponível no checkout</span>
                ) : (
                  <span className="tag tag-status-neutral">Faltam {missing}</span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="card loyalty-section">
        <h2>Extrato</h2>
        {history.length === 0 ? (
          <p className="muted">
            Nenhuma movimentação ainda. <Link to="/cardapio">Faça um pedido</Link> para começar a acumular.
          </p>
        ) : (
          <ul className="loyalty-history">
            {history.map((entry, index) => (
              <li key={index}>
                <span>
                  {entry.description}
                  <small className="muted">{formatDateTime(entry.at)}</small>
                </span>
                <strong className={entry.points > 0 ? 'points-plus' : 'points-minus'}>
                  {entry.points > 0 ? '+' : ''}
                  {entry.points}
                </strong>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default function Loyalty() {
  const { user, updateConsents } = useAuth()

  return (
    <section className="loyalty-page">
      <div className="loyalty-hero">
        <h1>Raízes+ Fidelidade</h1>
        <p>Cada pedido vira pontos, e os pontos viram desconto.</p>
      </div>

      {!user && (
        <div className="card loyalty-join">
          <h2>Entre para participar</h2>
          <p>O programa de fidelidade é para clientes com conta. É grátis e você escolhe se quer participar.</p>
          <div className="profile-actions">
            <Link to="/entrar" state={{ from: '/fidelidade' }} className="btn">
              Entrar
            </Link>
            <Link to="/cadastro" state={{ from: '/fidelidade' }} className="btn btn-outline">
              Criar conta
            </Link>
          </div>
        </div>
      )}

      {user && !isLoyaltyMember(user) && <JoinProgram onJoin={() => updateConsents({ loyalty: true })} />}

      {user && isLoyaltyMember(user) && <MemberArea user={user} />}

      <HowItWorks />

      {user && isLoyaltyMember(user) && (
        <p className="muted loyalty-footnote">
          Não quer mais participar? Desative em <Link to="/perfil">Perfil › Privacidade e consentimentos</Link>. Seu saldo
          fica guardado caso volte.
        </p>
      )}
    </section>
  )
}
