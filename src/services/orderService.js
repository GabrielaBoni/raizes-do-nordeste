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
      customer: { name: customer.name },
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
