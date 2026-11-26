import { simulateRequest, ApiError } from './api'

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
  }
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
