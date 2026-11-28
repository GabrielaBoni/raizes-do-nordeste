import { useEffect, useState } from 'react'
import { getUnits } from '../services/unitService'
import { getMenuByUnit } from '../services/menuService'
import { createOrder, registerPayment } from '../services/orderService'
import { generatePixCode, requestPayment } from '../services/paymentService'
import { calculateQuote, getCategoryPromotions } from '../services/promotionService'
import { formatPrice } from '../utils/format'
import './Totem.css'

const UNIT_KEY = 'raizes:totem-unidade'
const IDLE_SECONDS = 60
const WARNING_SECONDS = 15
const DONE_SECONDS = 20

const categoryIcons = {
  tapiocas: '🫓',
  cuscuz: '🌽',
  'cafe-da-manha': '☕',
  bolos: '🍰',
  bebidas: '🥤',
  juninos: '🎉',
}

const TEST_CARDS = {
  approved: '4111111111111111',
  declined: '4000000000000002',
}

function loadUnit() {
  try {
    return JSON.parse(localStorage.getItem(UNIT_KEY))
  } catch {
    return null
  }
}

function saveUnit(unit) {
  try {
    if (unit) localStorage.setItem(UNIT_KEY, JSON.stringify(unit))
    else localStorage.removeItem(UNIT_KEY)
  } catch {
    return
  }
}

function useIdleTimer(active, onTimeout) {
  const [idle, setIdle] = useState(0)

  useEffect(() => {
    if (!active) return

    function reset() {
      setIdle(0)
    }

    const timer = setInterval(() => setIdle((s) => s + 1), 1000)
    window.addEventListener('pointerdown', reset)
    window.addEventListener('keydown', reset)
    return () => {
      clearInterval(timer)
      window.removeEventListener('pointerdown', reset)
      window.removeEventListener('keydown', reset)
      setIdle(0)
    }
  }, [active])

  useEffect(() => {
    if (active && idle >= IDLE_SECONDS + WARNING_SECONDS) onTimeout()
  }, [active, idle, onTimeout])

  return {
    warning: active && idle >= IDLE_SECONDS,
    remaining: IDLE_SECONDS + WARNING_SECONDS - idle,
    dismiss: () => setIdle(0),
  }
}

function TotemSetup({ onSelect }) {
  const [units, setUnits] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getUnits()
      .then(setUnits)
      .catch(() => setError('Não foi possível carregar as unidades.'))
  }, [])

  return (
    <div className="totem totem-setup">
      <div className="totem-setup-card">
        <span className="totem-staff-tag">Uso da equipe</span>
        <h1>Configurar totem</h1>
        <p>Escolha a unidade onde este totem está instalado.</p>
        {error && <p className="totem-error">{error}</p>}
        {units.length === 0 && !error && <p>Carregando unidades...</p>}
        <div className="totem-setup-list">
          {units.map((unit) => (
            <button key={unit.id} onClick={() => onSelect(unit)}>
              <strong>{unit.name}</strong>
              <span>
                {unit.address} · Cozinha {unit.kitchen}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Welcome({ unit, onStart, onChangeUnit }) {
  return (
    <div className="totem totem-welcome" onClick={onStart}>
      <span className="totem-welcome-brand">Raízes do Nordeste</span>
      <span className="totem-welcome-title">Faça seu pedido aqui</span>
      <button
        className="totem-welcome-cta"
        onClick={(e) => {
          e.stopPropagation()
          onStart()
        }}
      >
        Toque para começar
      </button>
      <span className="totem-welcome-unit">{unit.name}</span>
      <span className="totem-welcome-privacy">
        🔒 Este totem não guarda seus dados. Ao final do atendimento, tudo é apagado.
      </span>
      <button
        className="totem-change-unit"
        onClick={(e) => {
          e.stopPropagation()
          onChangeUnit()
        }}
      >
        ⚙ Trocar unidade
      </button>
    </div>
  )
}

function QuantityControl({ quantity, onAdd, onRemove, name }) {
  return (
    <div className="totem-qty">
      <button onClick={onRemove} aria-label={`Remover um ${name}`}>
        −
      </button>
      <span>{quantity}</span>
      <button onClick={onAdd} aria-label={`Adicionar um ${name}`}>
        +
      </button>
    </div>
  )
}

function MenuStep({ unit, cart, onAdd, onRemove, onNext, onCancel, quote }) {
  const [menu, setMenu] = useState(null)
  const [error, setError] = useState('')
  const [category, setCategory] = useState(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true
    getMenuByUnit(unit.id)
      .then((data) => {
        if (!active) return
        setMenu(data)
        setCategory((current) => current ?? data.categories[0]?.id)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar o cardápio.')
      })
    return () => {
      active = false
    }
  }, [unit.id, reload])

  const promoByCategory = Object.fromEntries(getCategoryPromotions(unit).map((p) => [p.discount.category, p]))
  const quantityOf = (id) => cart.find((item) => item.id === id)?.quantity ?? 0
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="totem totem-menu">
      <header className="totem-header">
        <span className="totem-header-brand">Raízes do Nordeste</span>
        <button className="totem-btn-ghost" onClick={onCancel}>
          ✕ Cancelar pedido
        </button>
      </header>

      {error ? (
        <div className="totem-message">
          <p>{error}</p>
          <button
            className="totem-btn"
            onClick={() => {
              setError('')
              setReload((n) => n + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : !menu ? (
        <div className="totem-message">
          <p>Carregando cardápio...</p>
        </div>
      ) : (
        <div className="totem-menu-body">
          <nav className="totem-categories" aria-label="Categorias">
            {menu.categories.map((c) => (
              <button
                key={c.id}
                className={category === c.id ? 'active' : ''}
                aria-pressed={category === c.id}
                onClick={() => setCategory(c.id)}
              >
                <span className="totem-category-icon">{categoryIcons[c.id] ?? '🍽️'}</span>
                {c.name}
              </button>
            ))}
          </nav>

          <ul className="totem-products">
            {menu.items
              .filter((item) => item.category === category)
              .map((item) => {
                const quantity = quantityOf(item.id)
                const promo = promoByCategory[item.category]
                return (
                  <li key={item.id} className={`totem-product ${item.available ? '' : 'unavailable'}`}>
                    <span className="totem-product-icon">{categoryIcons[item.category] ?? '🍽️'}</span>
                    {promo && (
                      <span className="totem-promo">
                        −{promo.discount.value}% {promo.title}
                      </span>
                    )}
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="totem-product-footer">
                      <strong>{formatPrice(item.price)}</strong>
                      {!item.available ? (
                        <span className="totem-soldout">Esgotado</span>
                      ) : quantity > 0 ? (
                        <QuantityControl
                          name={item.name}
                          quantity={quantity}
                          onAdd={() => onAdd(item)}
                          onRemove={() => onRemove(item.id)}
                        />
                      ) : (
                        <button className="totem-btn totem-btn-small" onClick={() => onAdd(item)}>
                          Adicionar
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
          </ul>
        </div>
      )}

      <footer className="totem-bar">
        <div>
          <span>{totalItems === 0 ? 'Seu pedido está vazio' : `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`}</span>
          {totalItems > 0 && <strong>{formatPrice(quote.total)}</strong>}
        </div>
        <button className="totem-btn" onClick={onNext} disabled={totalItems === 0}>
          Ver pedido →
        </button>
      </footer>
    </div>
  )
}

function ReviewStep({ cart, quote, name, onNameChange, onAdd, onRemove, onBack, onPay }) {
  const [error, setError] = useState('')

  function choose(method) {
    if (name.trim().length < 2) {
      setError('Digite seu nome para chamarmos quando o pedido ficar pronto.')
      return
    }
    onPay(method)
  }

  return (
    <div className="totem totem-review">
      <header className="totem-header">
        <button className="totem-btn-ghost" onClick={onBack}>
          ← Continuar escolhendo
        </button>
        <span className="totem-header-brand">Seu pedido</span>
      </header>

      <div className="totem-review-body">
        <section className="totem-panel">
          <ul className="totem-review-items">
            {cart.map((item) => (
              <li key={item.id}>
                <span className="totem-review-name">{item.name}</span>
                <QuantityControl
                  name={item.name}
                  quantity={item.quantity}
                  onAdd={() => onAdd(item)}
                  onRemove={() => onRemove(item.id)}
                />
                <strong>{formatPrice(item.price * item.quantity)}</strong>
              </li>
            ))}
          </ul>
          <div className="totem-totals">
            <div>
              <span>Subtotal</span>
              <span>{formatPrice(quote.subtotal)}</span>
            </div>
            {quote.discounts.map((discount) => (
              <div key={discount.id} className="totem-discount">
                <span>{discount.label}</span>
                <span>− {formatPrice(discount.amount)}</span>
              </div>
            ))}
            <div className="totem-total">
              <span>Total</span>
              <strong>{formatPrice(quote.total)}</strong>
            </div>
          </div>
          <p className="totem-hint">Cupons e pontos de fidelidade estão disponíveis no app e no site.</p>
        </section>

        <section className="totem-panel">
          <label htmlFor="totem-name" className="totem-label">
            Como podemos te chamar?
          </label>
          <input
            id="totem-name"
            className="totem-input"
            value={name}
            maxLength={20}
            autoComplete="off"
            onChange={(e) => {
              onNameChange(e.target.value)
              setError('')
            }}
            aria-invalid={!!error}
            aria-describedby="totem-name-help"
          />
          {error && <p className="totem-error">{error}</p>}
          <p id="totem-name-help" className="totem-hint">
            🔒 Usamos seu nome só para chamar você no balcão. Ele não fica salvo neste totem.
          </p>

          <p className="totem-label">Como você quer pagar?</p>
          <div className="totem-methods">
            <button onClick={() => choose('pix')}>
              <span>⚡</span>
              Pix
            </button>
            <button onClick={() => choose('cartao')}>
              <span>💳</span>
              Cartão
              <small>débito ou crédito</small>
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

function PaymentStep({ order, method, status, message, onCardTap, onRetry, onChangeMethod, onCancel }) {
  if (status === 'declined' || status === 'failed') {
    return (
      <div className="totem totem-center">
        <div className="totem-result error">
          <span className="totem-result-icon">{status === 'declined' ? '✕' : '!'}</span>
          <h1>{status === 'declined' ? 'Pagamento recusado' : 'Não recebemos a confirmação'}</h1>
          <p>{message}</p>
          <p className="totem-hint">Nenhum valor foi cobrado. Pedido {order.id}.</p>
          <div className="totem-actions">
            {status === 'failed' && (
              <button className="totem-btn" onClick={onRetry}>
                Tentar novamente
              </button>
            )}
            <button className="totem-btn" onClick={onChangeMethod}>
              Escolher outra forma
            </button>
            <button className="totem-btn-ghost" onClick={onCancel}>
              Cancelar pedido
            </button>
          </div>
        </div>
      </div>
    )
  }

  const processing = status === 'processing'

  return (
    <div className="totem totem-center">
      <div className="totem-result">
        <p className="totem-amount">
          Total <strong>{formatPrice(order.total)}</strong>
        </p>
        {method === 'pix' ? (
          <>
            <h1>Pague com Pix</h1>
            <div className="totem-qrcode" aria-label="QR Code do Pix">
              QR Code
            </div>
            <p>Abra o app do seu banco e escaneie o QR Code.</p>
            <code className="totem-pix-code">{generatePixCode(order.id, order.total)}</code>
            <p className="totem-waiting">
              <span className="totem-spinner" aria-hidden="true" /> Aguardando confirmação do pagamento...
            </p>
          </>
        ) : (
          <>
            <h1>{processing ? 'Processando pagamento...' : 'Use a maquininha ao lado'}</h1>
            <div className="totem-card-reader" aria-hidden="true">
              💳
            </div>
            {processing ? (
              <p className="totem-waiting">
                <span className="totem-spinner" aria-hidden="true" /> Comunicando com a operadora. Não retire o cartão.
              </p>
            ) : (
              <>
                <p>Aproxime, insira ou passe o cartão na maquininha.</p>
                <div className="totem-demo">
                  <strong>Demonstração:</strong> simule a leitura do cartão
                  <div className="totem-actions">
                    <button className="totem-btn totem-btn-small" onClick={() => onCardTap(TEST_CARDS.approved)}>
                      Cartão aprovado
                    </button>
                    <button className="totem-btn-ghost totem-btn-small" onClick={() => onCardTap(TEST_CARDS.declined)}>
                      Cartão recusado
                    </button>
                  </div>
                </div>
                <button className="totem-btn-ghost" onClick={onChangeMethod}>
                  ← Voltar
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DoneStep({ order, onFinish }) {
  const [seconds, setSeconds] = useState(DONE_SECONDS)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s - 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (seconds <= 0) onFinish()
  }, [seconds, onFinish])

  return (
    <div className="totem totem-center">
      <div className="totem-result success">
        <span className="totem-result-icon">✓</span>
        <h1>Pedido confirmado!</h1>
        <p>Sua senha é</p>
        <strong className="totem-ticket">{order.id.replace('RN-', '')}</strong>
        <p>
          Vamos chamar <strong>{order.customer.name}</strong> no balcão quando estiver pronto.
        </p>
        {order.discounts?.length > 0 && (
          <p className="totem-hint">Você economizou {formatPrice(order.subtotal - order.total)} com as promoções de hoje.</p>
        )}
        <button className="totem-btn" onClick={onFinish}>
          Concluir ({seconds})
        </button>
      </div>
    </div>
  )
}

function TotemSession({ unit, onReset, onChangeUnit }) {
  const [step, setStep] = useState('welcome')
  const [cart, setCart] = useState([])
  const [name, setName] = useState('')
  const [method, setMethod] = useState(null)
  const [order, setOrder] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState('idle')
  const [paymentMessage, setPaymentMessage] = useState('')

  const trackIdle = step === 'menu' || step === 'review' || (step === 'payment' && paymentStatus !== 'processing')
  const idle = useIdleTimer(trackIdle, onReset)
  const quote = calculateQuote({ items: cart, unit })

  function addItem(product) {
    setCart((prev) =>
      prev.some((item) => item.id === product.id)
        ? prev.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...prev, { id: product.id, name: product.name, price: product.price, quantity: 1 }],
    )
  }

  function removeItem(productId) {
    setCart((prev) =>
      prev
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  async function processPayment(currentOrder, paymentMethod, cardNumber) {
    setPaymentStatus('processing')
    try {
      const result = await requestPayment({
        orderId: currentOrder.id,
        amount: currentOrder.total,
        method: paymentMethod,
        card: paymentMethod === 'cartao' ? { number: cardNumber } : null,
      })
      const updated = await registerPayment(currentOrder.id, result)
      setOrder(updated)
      if (result.status === 'aprovado') {
        setStep('done')
      } else {
        setPaymentMessage(result.message)
        setPaymentStatus('declined')
      }
    } catch (err) {
      setPaymentMessage(err.message || 'Não foi possível processar o pagamento.')
      setPaymentStatus('failed')
    }
  }

  async function startPayment(paymentMethod) {
    setMethod(paymentMethod)
    setPaymentMessage('')
    setStep('payment')

    let currentOrder = order
    if (!currentOrder) {
      setPaymentStatus('processing')
      try {
        currentOrder = await createOrder({
          unit,
          items: cart,
          channel: 'totem',
          customer: { name: name.trim(), userId: null },
        })
        setOrder(currentOrder)
      } catch (err) {
        setPaymentMessage(err.message)
        setPaymentStatus('failed')
        return
      }
    }

    if (paymentMethod === 'pix') {
      processPayment(currentOrder, 'pix')
    } else {
      setPaymentStatus('waiting-card')
    }
  }

  function changeMethod() {
    setPaymentStatus('idle')
    setStep('review')
  }

  let content
  if (step === 'welcome') {
    content = <Welcome unit={unit} onStart={() => setStep('menu')} onChangeUnit={onChangeUnit} />
  } else if (step === 'menu') {
    content = (
      <MenuStep
        unit={unit}
        cart={cart}
        quote={quote}
        onAdd={addItem}
        onRemove={removeItem}
        onNext={() => setStep('review')}
        onCancel={onReset}
      />
    )
  } else if (step === 'review') {
    content = order ? (
      <ReviewLocked order={order} onPay={startPayment} onCancel={onReset} />
    ) : (
      <ReviewStep
        cart={cart}
        quote={quote}
        name={name}
        onNameChange={setName}
        onAdd={addItem}
        onRemove={removeItem}
        onBack={() => setStep('menu')}
        onPay={startPayment}
      />
    )
  } else if (step === 'payment') {
    content = order ? (
      <PaymentStep
        order={order}
        method={method}
        status={paymentStatus}
        message={paymentMessage}
        onCardTap={(cardNumber) => processPayment(order, 'cartao', cardNumber)}
        onRetry={() => (method === 'pix' ? processPayment(order, 'pix') : setPaymentStatus('waiting-card'))}
        onChangeMethod={changeMethod}
        onCancel={onReset}
      />
    ) : paymentStatus === 'failed' ? (
      <div className="totem totem-center">
        <div className="totem-result error">
          <span className="totem-result-icon">!</span>
          <h1>Não foi possível criar o pedido</h1>
          <p>{paymentMessage}</p>
          <button className="totem-btn" onClick={changeMethod}>
            Voltar
          </button>
        </div>
      </div>
    ) : (
      <div className="totem totem-center">
        <p className="totem-waiting">
          <span className="totem-spinner" aria-hidden="true" /> Enviando seu pedido...
        </p>
      </div>
    )
  } else {
    content = <DoneStep order={order} onFinish={onReset} />
  }

  return (
    <>
      {content}
      {idle.warning && (
        <div className="totem-overlay" role="alertdialog" aria-labelledby="totem-idle-title">
          <div className="totem-dialog">
            <h2 id="totem-idle-title">Você ainda está aí?</h2>
            <p>
              Por segurança, o pedido será cancelado e os dados apagados em <strong>{idle.remaining}s</strong>.
            </p>
            <div className="totem-actions">
              <button className="totem-btn" onClick={idle.dismiss}>
                Continuar pedido
              </button>
              <button className="totem-btn-ghost" onClick={onReset}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ReviewLocked({ order, onPay, onCancel }) {
  return (
    <div className="totem totem-center">
      <div className="totem-result">
        <h1>Escolha outra forma de pagamento</h1>
        <p className="totem-amount">
          Pedido {order.id} · <strong>{formatPrice(order.total)}</strong>
        </p>
        <div className="totem-methods">
          <button onClick={() => onPay('pix')}>
            <span>⚡</span>
            Pix
          </button>
          <button onClick={() => onPay('cartao')}>
            <span>💳</span>
            Cartão
            <small>débito ou crédito</small>
          </button>
        </div>
        <button className="totem-btn-ghost" onClick={onCancel}>
          Cancelar pedido
        </button>
      </div>
    </div>
  )
}

export default function Totem() {
  const [unit, setUnit] = useState(loadUnit)
  const [session, setSession] = useState(0)

  function selectUnit(selected) {
    saveUnit(selected)
    setUnit(selected)
  }

  if (!unit) return <TotemSetup onSelect={selectUnit} />

  return (
    <TotemSession
      key={session}
      unit={unit}
      onReset={() => setSession((n) => n + 1)}
      onChangeUnit={() => selectUnit(null)}
    />
  )
}
