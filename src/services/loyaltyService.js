import { loyaltyRewards, loyaltyTiers } from '../data/promotions'
import { simulateRequest } from './api'
import { formatPrice } from '../utils/format'

const STORAGE_KEY = 'raizes:fidelidade'

const seed = {
  'u-demo': {
    points: 320,
    lifetime: 420,
    history: [
      { type: 'earn', points: 180, description: 'Pedido RN-104211', at: '2026-11-03T09:12:00.000Z' },
      { type: 'earn', points: 140, description: 'Pedido RN-105876', at: '2026-11-10T08:40:00.000Z' },
      { type: 'redeem', points: -100, description: 'Resgate de R$ 5,00 no pedido RN-107002', at: '2026-11-15T10:05:00.000Z' },
      { type: 'earn', points: 100, description: 'Pedido RN-107002', at: '2026-11-15T10:05:00.000Z' },
    ],
  },
}

const EMPTY_ACCOUNT = { points: 0, lifetime: 0, history: [] }

function loadAll() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : seed
  } catch {
    return seed
  }
}

function saveAll(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    return
  }
}

export function getLoyaltyAccount(userId) {
  return structuredClone(loadAll()[userId] ?? EMPTY_ACCOUNT)
}

export function fetchLoyaltyAccount(userId) {
  return simulateRequest(() => getLoyaltyAccount(userId))
}

export function getTier(lifetime) {
  return [...loyaltyTiers].reverse().find((tier) => lifetime >= tier.minPoints)
}

export function getNextTier(lifetime) {
  return loyaltyTiers.find((tier) => tier.minPoints > lifetime) ?? null
}

export function isBirthdayMonth(user, date = new Date()) {
  if (!user?.birthDate) return false
  return Number(user.birthDate.slice(5, 7)) === date.getMonth() + 1
}

export function isLoyaltyMember(user) {
  return !!user?.consents?.loyalty?.accepted
}

export function calculatePoints(amount, user, account, date = new Date()) {
  const tier = getTier(account.lifetime)
  const birthday = isBirthdayMonth(user, date) ? 2 : 1
  return Math.floor(amount * tier.multiplier * birthday)
}

export function getAvailableRewards(account) {
  return loyaltyRewards.map((reward) => ({ ...reward, available: account.points >= reward.points }))
}

export function settleOrderPoints(order) {
  const { userId, pointsToEarn, pointsToRedeem, rewardValue } = order.loyalty
  const all = loadAll()
  const account = all[userId] ?? structuredClone(EMPTY_ACCOUNT)
  const at = new Date().toISOString()

  if (pointsToRedeem > 0) {
    account.points -= pointsToRedeem
    account.history.push({
      type: 'redeem',
      points: -pointsToRedeem,
      description: `Resgate de ${formatPrice(rewardValue)} no pedido ${order.id}`,
      at,
    })
  }
  if (pointsToEarn > 0) {
    account.points += pointsToEarn
    account.lifetime += pointsToEarn
    account.history.push({ type: 'earn', points: pointsToEarn, description: `Pedido ${order.id}`, at })
  }

  all[userId] = account
  saveAll(all)
}

export function deleteLoyaltyAccount(userId) {
  const all = loadAll()
  delete all[userId]
  saveAll(all)
}
