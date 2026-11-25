import { ApiError } from './api'

const CARD_DECLINED = '0002'
const CARD_TIMEOUT = '0003'

function generateTransactionId() {
  return 'TX' + Date.now().toString(36).toUpperCase()
}

export function generatePixCode(orderId, amount) {
  return `00020126BR.GOV.BCB.PIX0136raizesdonordeste${orderId}5204000053039865406${amount.toFixed(2)}5802BR`
}

export function requestPayment({ orderId, amount, method, card }) {
  const delay = method === 'pix' ? 4000 : 2500

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (method === 'cartao') {
        const lastDigits = card.number.slice(-4)

        if (lastDigits === CARD_TIMEOUT) {
          reject(new ApiError('O serviço de pagamento não respondeu a tempo.', 504))
          return
        }

        if (lastDigits === CARD_DECLINED) {
          resolve({
            status: 'recusado',
            method,
            transactionId: generateTransactionId(),
            message: 'Pagamento recusado pela operadora do cartão.',
            cardLastDigits: lastDigits,
          })
          return
        }
      }

      resolve({
        status: 'aprovado',
        method,
        orderId,
        amount,
        transactionId: generateTransactionId(),
        cardLastDigits: method === 'cartao' ? card.number.slice(-4) : null,
        paidAt: new Date().toISOString(),
      })
    }, delay)
  })
}
