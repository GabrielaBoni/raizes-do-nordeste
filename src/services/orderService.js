import { simulateRequest, ApiError } from './api'

const STORAGE_KEY = 'raizes:pedidos'

function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveOrders(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    return
  }
}

function generateOrderNumber() {
  return 'RN-' + Math.floor(100000 + Math.random() * 900000)
}

export function createOrder({ unit, items, customer, channel = 'app' }) {
  return simulateRequest(() => {
    if (!items.length) {
      throw new ApiError('O carrinho está vazio', 400)
    }

    const total = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100
    const order = {
      id: generateOrderNumber(),
      unitId: unit.id,
      unitName: unit.name,
      channel,
      customer: { name: customer.name, userId: customer.userId ?? null },
      items,
      total,
      status: 'aguardando_pagamento',
      payment: null,
      createdAt: new Date().toISOString(),
      history: [{ status: 'aguardando_pagamento', at: new Date().toISOString() }],
    }

    saveOrders([order, ...loadOrders()])
    return order
  })
}

export function registerPayment(orderId, payment) {
  return simulateRequest(() => {
    const orders = loadOrders()
    const order = orders.find((o) => o.id === orderId)
    if (!order) {
      throw new ApiError('Pedido não encontrado', 404)
    }

    const status = payment.status === 'aprovado' ? 'recebido' : 'pagamento_recusado'
    const updated = {
      ...order,
      status,
      payment,
      history: [...order.history, { status, at: new Date().toISOString() }],
    }

    saveOrders(orders.map((o) => (o.id === orderId ? updated : o)))
    return updated
  })
}

export function getOrders() {
  return simulateRequest(() => loadOrders())
}

export function getOrderById(orderId) {
  return simulateRequest(() => {
    const order = loadOrders().find((o) => o.id === orderId)
    if (!order) {
      throw new ApiError('Pedido não encontrado', 404)
    }
    return order
  })
}

const allowedTransitions = {
  recebido: ['em_preparo'],
  em_preparo: ['pronto'],
  pronto: ['retirado'],
}

export function getKitchenOrders(unitId) {
  return simulateRequest(() =>
    loadOrders()
      .filter((o) => o.unitId === unitId && allowedTransitions[o.status])
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
  )
}

export function updateOrderStatus(orderId, newStatus) {
  return simulateRequest(() => {
    const orders = loadOrders()
    const order = orders.find((o) => o.id === orderId)
    if (!order) {
      throw new ApiError('Pedido não encontrado', 404)
    }
    if (!allowedTransitions[order.status]?.includes(newStatus)) {
      throw new ApiError('Mudança de status não permitida', 409)
    }

    const updated = {
      ...order,
      status: newStatus,
      history: [...order.history, { status: newStatus, at: new Date().toISOString() }],
    }

    saveOrders(orders.map((o) => (o.id === orderId ? updated : o)))
    return updated
  })
}

export function getOrdersByUser(userId) {
  return loadOrders().filter((order) => order.customer?.userId === userId)
}

export function anonymizeUserOrders(userId) {
  const orders = loadOrders().map((order) =>
    order.customer?.userId === userId ? { ...order, customer: { name: 'Cliente removido', userId: null } } : order,
  )
  saveOrders(orders)
}
