export const orderStatus = {
  aguardando_pagamento: { label: 'Aguardando pagamento', tone: 'warning' },
  pagamento_recusado: { label: 'Pagamento recusado', tone: 'error' },
  recebido: { label: 'Pedido recebido', tone: 'info' },
  em_preparo: { label: 'Em preparo', tone: 'info' },
  pronto: { label: 'Pronto para retirada', tone: 'success' },
  retirado: { label: 'Retirado', tone: 'neutral' },
  cancelado: { label: 'Cancelado', tone: 'error' },
}

export const progressSteps = ['recebido', 'em_preparo', 'pronto', 'retirado']

export const activeStatuses = ['aguardando_pagamento', 'recebido', 'em_preparo', 'pronto']
