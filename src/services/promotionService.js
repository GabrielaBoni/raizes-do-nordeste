import { campaigns, loyaltyRewards, PERSONAL_OFFER_PERCENT } from '../data/promotions'
import { products } from '../data/products'
import { formatDate, formatPrice } from '../utils/format'
import { calculatePoints, getLoyaltyAccount, isBirthdayMonth, isLoyaltyMember } from './loyaltyService'

const PAID_STATUSES = ['recebido', 'em_preparo', 'pronto', 'retirado']

function round(value) {
  return Math.round(value * 100) / 100
}

function categoryOf(item) {
  return products.find((p) => p.id === item.id)?.category
}

function isActive(campaign, now) {
  return new Date(campaign.startsAt) <= now && now <= new Date(campaign.endsAt)
}

function appliesToUnit(campaign, unit) {
  return !campaign.regions || (unit && campaign.regions.includes(unit.region))
}

export function getCampaignStatus(campaign, now = new Date()) {
  if (now < new Date(campaign.startsAt)) return 'upcoming'
  if (now > new Date(campaign.endsAt)) return 'ended'
  return 'active'
}

export function getCampaigns(now = new Date()) {
  return campaigns
    .map((campaign) => ({ ...campaign, status: getCampaignStatus(campaign, now) }))
    .filter((campaign) => campaign.status !== 'ended')
}

export function getCategoryPromotions(unit, now = new Date()) {
  return campaigns.filter(
    (c) => c.type === 'automatic' && c.discount.category && isActive(c, now) && appliesToUnit(c, unit),
  )
}

export function getPaidOrders(orders) {
  return orders.filter((order) => PAID_STATUSES.includes(order.status))
}

export function getPersonalOffer(user, orderHistory) {
  if (!user?.consents?.marketing?.accepted) return null

  const counts = {}
  for (const order of getPaidOrders(orderHistory)) {
    for (const item of order.items) {
      counts[item.id] = (counts[item.id] ?? 0) + item.quantity
    }
  }

  const [favoriteId] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? []
  const product = products.find((p) => p.id === favoriteId)
  if (!product) return null

  return {
    id: `personal-${product.id}`,
    productId: product.id,
    productName: product.name,
    percent: PERSONAL_OFFER_PERCENT,
    times: counts[favoriteId],
  }
}

function automaticDiscount(campaign, items, subtotal) {
  const { discount } = campaign

  if (discount.requiresCategories) {
    const categories = new Set(items.map(categoryOf))
    const matches = discount.requiresCategories.every((category) => categories.has(category))
    return matches ? Math.min(discount.value, subtotal) : 0
  }

  const base = discount.category
    ? items.filter((item) => categoryOf(item) === discount.category).reduce((sum, i) => sum + i.price * i.quantity, 0)
    : subtotal
  return discount.kind === 'percent' ? (base * discount.value) / 100 : Math.min(discount.value, base)
}

function validateCoupon(code, { unit, user, orderHistory, subtotal, now }) {
  const campaign = campaigns.find((c) => c.type === 'coupon' && c.code === code)
  if (!campaign) return { error: 'Cupom não encontrado.' }

  const status = getCampaignStatus(campaign, now)
  if (status === 'upcoming') return { error: `Este cupom vale a partir de ${formatDate(campaign.startsAt)}.` }
  if (status === 'ended') return { error: 'Este cupom expirou.' }
  if (!appliesToUnit(campaign, unit)) return { error: 'Este cupom não vale para esta unidade.' }
  if (campaign.requiresAccount && !user) return { error: 'Entre na sua conta para usar este cupom.' }
  if (campaign.firstOrderOnly && getPaidOrders(orderHistory).length > 0) {
    return { error: 'Este cupom vale só para o primeiro pedido.' }
  }
  if (campaign.minSubtotal && subtotal < campaign.minSubtotal) {
    return { error: `Pedido mínimo de ${formatPrice(campaign.minSubtotal)} para este cupom.` }
  }

  return { campaign }
}

export function calculateQuote({ items, unit, user = null, couponCode = '', rewardId = null, orderHistory = [], now = new Date() }) {
  const subtotal = round(items.reduce((sum, item) => sum + item.price * item.quantity, 0))
  const discounts = []
  let remaining = subtotal

  function addDiscount(id, label, amount) {
    const value = round(Math.min(amount, remaining))
    if (value <= 0) return
    remaining = round(remaining - value)
    discounts.push({ id, label, amount: value })
  }

  for (const campaign of campaigns) {
    if (campaign.type !== 'automatic' || !isActive(campaign, now) || !appliesToUnit(campaign, unit)) continue
    addDiscount(campaign.id, campaign.title, automaticDiscount(campaign, items, subtotal))
  }

  const personalOffer = getPersonalOffer(user, orderHistory)
  if (personalOffer) {
    const item = items.find((i) => i.id === personalOffer.productId)
    if (item) {
      addDiscount(personalOffer.id, `Oferta para você (${personalOffer.percent}%)`, (item.price * personalOffer.percent) / 100)
    }
  }

  const code = couponCode.trim().toUpperCase()
  let coupon = null
  let couponError = ''
  if (code) {
    const result = validateCoupon(code, { unit, user, orderHistory, subtotal, now })
    if (result.error) {
      couponError = result.error
    } else {
      const { discount } = result.campaign
      coupon = { code, title: result.campaign.title }
      addDiscount(result.campaign.id, `Cupom ${code}`, discount.kind === 'percent' ? (subtotal * discount.value) / 100 : discount.value)
    }
  }

  const member = !!user && isLoyaltyMember(user)
  const account = member ? getLoyaltyAccount(user.id) : null
  let reward = null
  let rewardError = ''
  if (rewardId) {
    const selected = loyaltyRewards.find((r) => r.id === rewardId)
    if (!member || !selected) {
      rewardError = 'Recompensa indisponível.'
    } else if (account.points < selected.points) {
      rewardError = 'Pontos insuficientes para esta recompensa.'
    } else {
      reward = selected
      addDiscount(`reward-${selected.id}`, `Resgate de ${selected.points} pontos`, selected.value)
    }
  }

  const discountTotal = round(subtotal - remaining)
  const total = remaining

  return {
    subtotal,
    discounts,
    discountTotal,
    total,
    coupon,
    couponError,
    reward,
    rewardError,
    loyalty: {
      member,
      balance: account?.points ?? 0,
      pointsToEarn: member ? calculatePoints(total, user, account, now) : 0,
      birthday: member && isBirthdayMonth(user, now),
    },
  }
}
