import { simulateRequest, ApiError } from './api'
import { anonymizeUserOrders, getOrdersByUser } from './orderService'

const USERS_KEY = 'raizes:usuarios'
const SESSION_KEY = 'raizes:sessao'

export const CONSENT_VERSION = '2026-11'

const demoUser = {
  id: 'u-demo',
  name: 'Cliente Demonstração',
  email: 'demo@raizes.com',
  phone: '',
  birthDate: '',
  salt: 'a91f3c7e',
  passwordHash: '37c4addf1a7c8c0e3be9e7b5c6530f5fdbaf09dd39ccbd880017aec704467785',
  createdAt: '2026-11-01T12:00:00.000Z',
  consents: {
    version: CONSENT_VERSION,
    terms: { accepted: true, at: '2026-11-01T12:00:00.000Z' },
    loyalty: { accepted: true, at: '2026-11-01T12:00:00.000Z' },
    marketing: { accepted: false, at: '2026-11-01T12:00:00.000Z' },
  },
  consentHistory: [
    { type: 'terms', accepted: true, at: '2026-11-01T12:00:00.000Z' },
    { type: 'loyalty', accepted: true, at: '2026-11-01T12:00:00.000Z' },
    { type: 'marketing', accepted: false, at: '2026-11-01T12:00:00.000Z' },
  ],
}

function loadUsers() {
  try {
    const saved = localStorage.getItem(USERS_KEY)
    return saved ? JSON.parse(saved) : [demoUser]
  } catch {
    return [demoUser]
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    return
  }
}

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    birthDate: user.birthDate,
    createdAt: user.createdAt,
    consents: user.consents,
    consentHistory: user.consentHistory ?? initialHistory(user.consents),
  }
}

function initialHistory(consents) {
  return ['terms', 'loyalty', 'marketing']
    .filter((type) => consents?.[type])
    .map((type) => ({ type, accepted: consents[type].accepted, at: consents[type].at }))
}

function findUserIndex(users, userId) {
  const index = users.findIndex((u) => u.id === userId)
  if (index === -1) throw new ApiError('Conta não encontrada.', 404)
  return index
}

function generateSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(4))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(salt, password) {
  const data = new TextEncoder().encode(salt + password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function getSessionUser() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (!session) return null
    const user = loadUsers().find((u) => u.id === session.userId)
    return user ? toPublicUser(user) : null
  } catch {
    return null
  }
}

export async function register({ name, email, phone, birthDate, password, consents }) {
  const salt = generateSalt()
  const passwordHash = await hashPassword(salt, password)

  return simulateRequest(() => {
    const users = loadUsers()
    const normalizedEmail = email.trim().toLowerCase()

    if (users.some((u) => u.email === normalizedEmail)) {
      throw new ApiError('Já existe uma conta com este e-mail.', 409)
    }
    if (!consents.terms) {
      throw new ApiError('É preciso aceitar os Termos de Uso e a Política de Privacidade.', 400)
    }

    const now = new Date().toISOString()
    const user = {
      id: 'u-' + Date.now().toString(36),
      name: name.trim(),
      email: normalizedEmail,
      phone,
      birthDate,
      salt,
      passwordHash,
      createdAt: now,
      consents: {
        version: CONSENT_VERSION,
        terms: { accepted: true, at: now },
        loyalty: { accepted: consents.loyalty, at: now },
        marketing: { accepted: consents.marketing, at: now },
      },
      consentHistory: [
        { type: 'terms', accepted: true, at: now },
        { type: 'loyalty', accepted: consents.loyalty, at: now },
        { type: 'marketing', accepted: consents.marketing, at: now },
      ],
    }

    saveUsers([...users, user])
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }))
    return toPublicUser(user)
  })
}

export async function login(email, password) {
  const user = loadUsers().find((u) => u.email === email.trim().toLowerCase())
  const passwordHash = user ? await hashPassword(user.salt, password) : null

  return simulateRequest(() => {
    if (!user || user.passwordHash !== passwordHash) {
      throw new ApiError('E-mail ou senha incorretos.', 401)
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }))
    return toPublicUser(user)
  })
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    return
  }
}

export function updateProfile(userId, { name, phone }) {
  return simulateRequest(() => {
    if (name.trim().length < 3) throw new ApiError('Informe seu nome completo.', 400)
    const users = loadUsers()
    const index = findUserIndex(users, userId)
    users[index] = { ...users[index], name: name.trim(), phone }
    saveUsers(users)
    return toPublicUser(users[index])
  })
}

export function updateConsents(userId, changes) {
  return simulateRequest(() => {
    const users = loadUsers()
    const index = findUserIndex(users, userId)
    const user = users[index]
    const now = new Date().toISOString()
    const consents = { ...user.consents }
    const history = [...(user.consentHistory ?? initialHistory(user.consents))]

    for (const type of ['loyalty', 'marketing']) {
      if (type in changes && changes[type] !== consents[type]?.accepted) {
        consents[type] = { accepted: changes[type], at: now }
        history.push({ type, accepted: changes[type], at: now })
      }
    }

    users[index] = { ...user, consents, consentHistory: history }
    saveUsers(users)
    return toPublicUser(users[index])
  })
}

export function exportUserData(userId) {
  return simulateRequest(() => {
    const users = loadUsers()
    const user = users[findUserIndex(users, userId)]
    const account = toPublicUser(user)
    return {
      exportedAt: new Date().toISOString(),
      controller: 'Raízes do Nordeste',
      account: {
        id: account.id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        birthDate: account.birthDate,
        createdAt: account.createdAt,
      },
      consents: account.consents,
      consentHistory: account.consentHistory,
      orders: getOrdersByUser(userId).map((order) => ({
        id: order.id,
        createdAt: order.createdAt,
        unit: order.unitName,
        channel: order.channel,
        status: order.status,
        total: order.total,
        items: order.items?.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      })),
    }
  })
}

export async function deleteAccount(userId, password) {
  const user = loadUsers().find((u) => u.id === userId)
  const passwordHash = user ? await hashPassword(user.salt, password) : null

  return simulateRequest(() => {
    if (!user) throw new ApiError('Conta não encontrada.', 404)
    if (user.passwordHash !== passwordHash) throw new ApiError('Senha incorreta.', 401)
    saveUsers(loadUsers().filter((u) => u.id !== userId))
    anonymizeUserOrders(userId)
    localStorage.removeItem(SESSION_KEY)
    return { deleted: true }
  })
}
