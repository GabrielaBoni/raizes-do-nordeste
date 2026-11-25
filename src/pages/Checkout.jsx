import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useUnit } from '../contexts/UnitContext'
import { createOrder, registerPayment } from '../services/orderService'
import { requestPayment, generatePixCode } from '../services/paymentService'
import { formatPrice, formatCardNumber, formatExpiry, onlyDigits } from '../utils/format'
import './Checkout.css'

const initialForm = {
  name: '',
  method: 'pix',
  cardNumber: '',
  cardName: '',
  expiry: '',
  cvv: '',
}

function isExpiryValid(expiry) {
  const [month, year] = expiry.split('/').map(Number)
  if (!month || !year || month < 1 || month > 12) return false
  const now = new Date()
  const currentYear = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1
  return year > currentYear || (year === currentYear && month >= currentMonth)
}

function validate(form) {
  const errors = {}

  if (form.name.trim().length < 2) {
    errors.name = 'Informe seu nome para chamarmos na retirada.'
  }

  if (form.method === 'cartao') {
    if (onlyDigits(form.cardNumber).length !== 16) {
      errors.cardNumber = 'O número do cartão deve ter 16 dígitos.'
    }
    if (form.cardName.trim().length < 3) {
      errors.cardName = 'Informe o nome impresso no cartão.'
    }
    if (!isExpiryValid(form.expiry)) {
      errors.expiry = 'Validade inválida ou cartão vencido.'
    }
    if (onlyDigits(form.cvv).length !== 3) {
      errors.cvv = 'O CVV deve ter 3 dígitos.'
    }
  }

  return errors
}

const methodLabels = {
  pix: 'Pix',
  cartao: 'Cartão de crédito',
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const { unit } = useUnit()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [step, setStep] = useState('form')
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [failMessage, setFailMessage] = useState('')
  const [copied, setCopied] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    let newValue = value
    if (name === 'cardNumber') newValue = formatCardNumber(value)
    if (name === 'expiry') newValue = formatExpiry(value)
    if (name === 'cvv') newValue = onlyDigits(value).slice(0, 3)

    setForm((prev) => ({ ...prev, [name]: newValue }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function pay() {
    setStep('processing')
    setCopied(false)

    try {
      let currentOrder = order
      if (!currentOrder) {
        currentOrder = await createOrder({ unit, items, customer: { name: form.name.trim() } })
        setOrder(currentOrder)
      }

      const result = await requestPayment({
        orderId: currentOrder.id,
        amount: currentOrder.total,
        method: form.method,
        card: form.method === 'cartao' ? { number: onlyDigits(form.cardNumber) } : null,
      })

      const updatedOrder = await registerPayment(currentOrder.id, result)
      setOrder(updatedOrder)
      setPayment(result)

      if (result.status === 'aprovado') {
        clearCart()
        setStep('approved')
      } else {
        setStep('declined')
      }
    } catch (err) {
      setFailMessage(err.message || 'Não foi possível processar o pagamento.')
      setStep('failed')
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const formErrors = validate(form)
    setErrors(formErrors)
    if (Object.keys(formErrors).length > 0) return
    pay()
  }

  function backToForm() {
    setForm((prev) => ({ ...prev, cardNumber: '', cardName: '', expiry: '', cvv: '' }))
    setStep('form')
  }

  async function copyPixCode(code) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  if (step === 'approved') {
    return (
      <section className="checkout-result">
        <div className="card result-card success">
          <div className="result-icon">✓</div>
          <h1>Pagamento aprovado!</h1>
          <p>
            Pedido <strong>{order.id}</strong>
          </p>
          <dl className="result-details">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
            <dt>Forma de pagamento</dt>
            <dd>
              {methodLabels[payment.method]}
              {payment.cardLastDigits && ` final ${payment.cardLastDigits}`}
            </dd>
            <dt>Transação</dt>
            <dd>{payment.transactionId}</dd>
            <dt>Retirada</dt>
            <dd>{order.unitName}</dd>
          </dl>
          <p className="muted">
            Seu pedido já foi enviado para a cozinha. Vamos chamar <strong>{order.customer.name}</strong> quando estiver
            pronto.
          </p>
          <div className="result-actions">
            <Link to={`/pedidos/${order.id}`} className="btn">
              Acompanhar pedido
            </Link>
            <Link to="/" className="btn btn-outline">
              Voltar ao início
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (step === 'processing') {
    const pixCode = order ? generatePixCode(order.id, order.total) : ''
    return (
      <section className="checkout-result">
        <div className="card result-card" role="status" aria-live="polite">
          <div className="spinner" aria-hidden="true"></div>
          {form.method === 'pix' ? (
            <>
              <h1>Aguardando pagamento via Pix</h1>
              {order && (
                <>
                  <div className="pix-qrcode" aria-label="QR Code do Pix">
                    QR Code
                  </div>
                  <p className="muted">Ou copie o código Pix:</p>
                  <code className="pix-code">{pixCode}</code>
                  <button className="btn btn-outline btn-small" onClick={() => copyPixCode(pixCode)}>
                    {copied ? 'Código copiado!' : 'Copiar código'}
                  </button>
                </>
              )}
            </>
          ) : (
            <h1>Enviando pagamento para a operadora...</h1>
          )}
          <p className="muted">
            Estamos aguardando a confirmação do serviço de pagamento. Não feche esta página.
          </p>
        </div>
      </section>
    )
  }

  if (step === 'declined') {
    return (
      <section className="checkout-result">
        <div className="card result-card error">
          <div className="result-icon">✕</div>
          <h1>Pagamento recusado</h1>
          <p>{payment.message}</p>
          <p className="muted">
            Seu pedido <strong>{order.id}</strong> continua salvo. Nenhum valor foi cobrado.
          </p>
          <div className="result-actions">
            <button className="btn" onClick={backToForm}>
              Tentar com outro pagamento
            </button>
            <Link to="/carrinho" className="btn btn-outline">
              Voltar ao carrinho
            </Link>
          </div>
        </div>
      </section>
    )
  }

  if (step === 'failed') {
    return (
      <section className="checkout-result">
        <div className="card result-card warning">
          <div className="result-icon">!</div>
          <h1>Não recebemos a confirmação</h1>
          <p>{failMessage}</p>
          <p className="muted">
            Não se preocupe: se houver cobrança sem confirmação, o valor é estornado automaticamente pelo provedor.
          </p>
          <div className="result-actions">
            <button className="btn" onClick={pay}>
              Tentar novamente
            </button>
            <button className="btn btn-outline" onClick={backToForm}>
              Trocar forma de pagamento
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (!unit || items.length === 0) {
    return (
      <section>
        <h1>Finalizar pedido</h1>
        <div className="card empty-state">
          <p>Seu carrinho está vazio. Adicione produtos antes de finalizar o pedido.</p>
          <Link to="/cardapio" className="btn">
            Ver cardápio
          </Link>
        </div>
      </section>
    )
  }

  const orderItems = order ? order.items : items
  const orderTotal = order ? order.total : subtotal

  return (
    <section>
      <h1>Finalizar pedido</h1>

      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={handleSubmit} noValidate>
          <fieldset className="card">
            <legend>Retirada</legend>
            <p className="muted">Retirada no balcão da unidade {unit.name}.</p>
            <label htmlFor="name">Nome para chamada</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={!!order}
              aria-invalid={!!errors.name}
              aria-describedby="name-help"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
            <small id="name-help" className="muted">
              Usamos seu nome apenas para chamar você quando o pedido estiver pronto.
            </small>
          </fieldset>

          <fieldset className="card">
            <legend>Pagamento</legend>
            <div className="method-options">
              {Object.entries(methodLabels).map(([value, label]) => (
                <label key={value} className={`method-option ${form.method === value ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="method"
                    value={value}
                    checked={form.method === value}
                    onChange={handleChange}
                  />
                  {label}
                </label>
              ))}
            </div>

            {form.method === 'cartao' && (
              <div className="card-fields">
                <div className="field">
                  <label htmlFor="cardNumber">Número do cartão</label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    value={form.cardNumber}
                    onChange={handleChange}
                    aria-invalid={!!errors.cardNumber}
                  />
                  {errors.cardNumber && <span className="field-error">{errors.cardNumber}</span>}
                </div>
                <div className="field">
                  <label htmlFor="cardName">Nome impresso no cartão</label>
                  <input
                    id="cardName"
                    name="cardName"
                    autoComplete="cc-name"
                    value={form.cardName}
                    onChange={handleChange}
                    aria-invalid={!!errors.cardName}
                  />
                  {errors.cardName && <span className="field-error">{errors.cardName}</span>}
                </div>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="expiry">Validade</label>
                    <input
                      id="expiry"
                      name="expiry"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/AA"
                      value={form.expiry}
                      onChange={handleChange}
                      aria-invalid={!!errors.expiry}
                    />
                    {errors.expiry && <span className="field-error">{errors.expiry}</span>}
                  </div>
                  <div className="field">
                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      name="cvv"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      value={form.cvv}
                      onChange={handleChange}
                      aria-invalid={!!errors.cvv}
                    />
                    {errors.cvv && <span className="field-error">{errors.cvv}</span>}
                  </div>
                </div>
                <p className="privacy-note">
                  🔒 Os dados do cartão são enviados diretamente ao provedor de pagamento e não ficam armazenados na
                  Raízes do Nordeste.
                </p>
              </div>
            )}

            <div className="demo-note">
              <strong>Ambiente de demonstração:</strong> nenhum pagamento real é feito. Use qualquer cartão válido para
              aprovar, cartão terminado em <code>0002</code> para simular recusa e terminado em <code>0003</code> para
              simular falha de comunicação com o provedor.
            </div>
          </fieldset>

          <button type="submit" className="btn checkout-submit">
            Pagar {formatPrice(orderTotal)}
          </button>
        </form>

        <aside className="card checkout-summary">
          <h2>Seu pedido</h2>
          <ul>
            {orderItems.map((item) => (
              <li key={item.id}>
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>{formatPrice(orderTotal)}</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}
