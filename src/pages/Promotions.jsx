import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getOrdersByUser } from '../services/orderService'
import { getCampaigns, getPersonalOffer } from '../services/promotionService'
import { formatDate, formatPrice } from '../utils/format'
import './Promotions.css'

function CampaignCard({ campaign }) {
  const [copied, setCopied] = useState(false)
  const upcoming = campaign.status === 'upcoming'

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(campaign.code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <li className={`card promo-card ${upcoming ? 'upcoming' : ''}`}>
      <div className="promo-card-top">
        <span className={`tag ${upcoming ? 'tag-status-neutral' : 'tag-status-success'}`}>
          {upcoming ? `Começa em ${formatDate(campaign.startsAt)}` : `Válida até ${formatDate(campaign.endsAt)}`}
        </span>
        {campaign.discount.kind === 'percent' ? (
          <strong className="promo-value">−{campaign.discount.value}%</strong>
        ) : (
          <strong className="promo-value">−{formatPrice(campaign.discount.value)}</strong>
        )}
      </div>
      <h3>{campaign.title}</h3>
      <p className="muted">{campaign.description}</p>

      <ul className="promo-rules">
        {campaign.regions && <li>Só nas unidades do {campaign.regions.join(', ')}</li>}
        {campaign.minSubtotal && <li>Pedido mínimo de {formatPrice(campaign.minSubtotal)}</li>}
        {campaign.requiresAccount && <li>Precisa estar logado</li>}
      </ul>

      {campaign.type === 'coupon' ? (
        <div className="promo-code">
          <code>{campaign.code}</code>
          <button className="btn btn-outline btn-small" onClick={copyCode} disabled={upcoming}>
            {copied ? 'Copiado!' : 'Copiar cupom'}
          </button>
        </div>
      ) : (
        <p className="promo-auto">✓ Desconto aplicado automaticamente no carrinho</p>
      )}
    </li>
  )
}

function PersonalOffers() {
  const { user, updateConsents } = useAuth()
  const [activating, setActivating] = useState(false)

  if (!user) {
    return (
      <div className="card personal-offer locked">
        <h2>Ofertas para você</h2>
        <p className="muted">Entre na sua conta para receber descontos baseados no que você mais gosta de pedir.</p>
        <Link to="/entrar" state={{ from: '/promocoes' }} className="btn btn-small">
          Entrar
        </Link>
      </div>
    )
  }

  if (!user.consents.marketing?.accepted) {
    async function activate() {
      setActivating(true)
      try {
        await updateConsents({ marketing: true })
      } finally {
        setActivating(false)
      }
    }

    return (
      <div className="card personal-offer locked">
        <h2>Ofertas para você</h2>
        <p>
          Quer receber descontos nos produtos que você mais pede? Para isso, precisamos da sua autorização para usar o{' '}
          <strong>histórico dos seus pedidos</strong> para personalizar ofertas.
        </p>
        <p className="muted">Você pode desativar quando quiser no seu perfil.</p>
        <button className="btn btn-small" onClick={activate} disabled={activating}>
          {activating ? 'Ativando...' : 'Autorizar ofertas personalizadas'}
        </button>
      </div>
    )
  }

  const offer = getPersonalOffer(user, getOrdersByUser(user.id))

  return (
    <div className="card personal-offer">
      <h2>Ofertas para você</h2>
      {offer ? (
        <div className="personal-offer-body">
          <strong className="promo-value">−{offer.percent}%</strong>
          <div>
            <h3>{offer.productName}</h3>
            <p className="muted">
              Você já pediu {offer.times} {offer.times === 1 ? 'vez' : 'vezes'}. O desconto entra sozinho quando ele estiver
              no carrinho.
            </p>
          </div>
        </div>
      ) : (
        <p className="muted">
          Ainda não temos pedidos seus para personalizar. Faça seu primeiro pedido e volte aqui!
        </p>
      )}
      <small className="muted personal-offer-note">
        Oferta gerada com base no seu histórico, conforme sua autorização. <Link to="/perfil">Gerenciar</Link>
      </small>
    </div>
  )
}

export default function Promotions() {
  const campaigns = getCampaigns()
  const active = campaigns.filter((c) => c.status === 'active')
  const upcoming = campaigns.filter((c) => c.status === 'upcoming')

  return (
    <section className="promotions-page">
      <h1>Promoções</h1>
      <p className="muted">Campanhas válidas nas unidades Raízes do Nordeste. É possível usar um cupom por pedido.</p>

      <PersonalOffers />

      <h2>Em andamento</h2>
      <ul className="promo-list">
        {active.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </ul>

      {upcoming.length > 0 && (
        <>
          <h2>Em breve</h2>
          <ul className="promo-list">
            {upcoming.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </ul>
        </>
      )}

      <div className="card promo-loyalty">
        <div>
          <h2>Raízes+ Fidelidade</h2>
          <p className="muted">Acumule pontos em cada pedido e troque por até {formatPrice(35)} de desconto.</p>
        </div>
        <Link to="/fidelidade" className="btn btn-outline btn-small">
          Conhecer o programa
        </Link>
      </div>
    </section>
  )
}
