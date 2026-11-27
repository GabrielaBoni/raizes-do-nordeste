export const campaigns = [
  {
    id: 'semana-cuscuz',
    title: 'Semana do Cuscuz',
    description: '10% de desconto em todos os cuscuz do cardápio.',
    type: 'automatic',
    discount: { kind: 'percent', value: 10, category: 'cuscuz' },
    startsAt: '2026-11-20T00:00:00-03:00',
    endsAt: '2026-12-06T23:59:59-03:00',
  },
  {
    id: 'combo-cafe',
    title: 'Combo café da manhã',
    description: 'R$ 4 de desconto levando um item de café da manhã e uma bebida.',
    type: 'automatic',
    discount: { kind: 'fixed', value: 4, requiresCategories: ['cafe-da-manha', 'bebidas'] },
    regions: ['Nordeste'],
    startsAt: '2026-11-01T00:00:00-03:00',
    endsAt: '2026-12-31T23:59:59-03:00',
  },
  {
    id: 'bem-vindo',
    title: 'Primeiro pedido',
    description: 'R$ 10 de desconto no primeiro pedido com conta, a partir de R$ 40.',
    type: 'coupon',
    code: 'BEMVINDO10',
    discount: { kind: 'fixed', value: 10 },
    minSubtotal: 40,
    requiresAccount: true,
    firstOrderOnly: true,
    startsAt: '2026-11-01T00:00:00-03:00',
    endsAt: '2027-06-30T23:59:59-03:00',
  },
  {
    id: 'black-raizes',
    title: 'Black Raízes',
    description: '20% de desconto em todo o cardápio, só no fim de semana da Black Friday.',
    type: 'coupon',
    code: 'BLACKRAIZES',
    discount: { kind: 'percent', value: 20 },
    startsAt: '2026-11-27T00:00:00-03:00',
    endsAt: '2026-11-30T23:59:59-03:00',
  },
  {
    id: 'sao-joao-2026',
    title: 'Arraiá Raízes',
    description: '15% de desconto nos especiais juninos.',
    type: 'automatic',
    discount: { kind: 'percent', value: 15, category: 'juninos' },
    startsAt: '2026-06-01T00:00:00-03:00',
    endsAt: '2026-06-30T23:59:59-03:00',
  },
]

export const loyaltyTiers = [
  { id: 'semente', name: 'Semente', minPoints: 0, multiplier: 1 },
  { id: 'mandacaru', name: 'Mandacaru', minPoints: 300, multiplier: 1.25 },
  { id: 'juazeiro', name: 'Juazeiro', minPoints: 800, multiplier: 1.5 },
]

export const loyaltyRewards = [
  { id: 'r100', points: 100, value: 5 },
  { id: 'r250', points: 250, value: 15 },
  { id: 'r500', points: 500, value: 35 },
]

export const PERSONAL_OFFER_PERCENT = 15
