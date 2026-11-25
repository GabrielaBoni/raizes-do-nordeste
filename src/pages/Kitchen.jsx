import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { units } from '../data/units'
import { getKitchenOrders, updateOrderStatus } from '../services/orderService'
import { usePolling } from '../hooks/usePolling'
import { useUnit } from '../contexts/UnitContext'
import { formatTime } from '../utils/format'
import './Kitchen.css'

const STORAGE_KEY = 'raizes:cozinha-unidade'

const columns = [
  { status: 'recebido', title: 'Novos', action: 'Iniciar preparo', next: 'em_preparo' },
  { status: 'em_preparo', title: 'Em preparo', action: 'Marcar como pronto', next: 'pronto' },
  { status: 'pronto', title: 'Prontos', action: 'Confirmar retirada', next: 'retirado' },
]

const channelLabels = {
  app: 'App',
  totem: 'Totem',
  balcao: 'Balcão',
}

const PREP_MINUTES = 15
const WARNING_MINUTES = 5

function loadKitchenUnit(fallback) {
  try {
    return localStorage.getItem(STORAGE_KEY) || fallback
  } catch {
    return fallback
  }
}

function statusTime(order, status) {
  return order.history.find((h) => h.status === status)?.at ?? order.createdAt
}

function getTiming(order, now) {
  if (order.status === 'pronto') {
    return {
      state: 'ready',
      label: `Pronto às ${formatTime(statusTime(order, 'pronto'))}`,
      detail: 'aguardando retirada',
    }
  }

  const deadline = new Date(statusTime(order, 'recebido')).getTime() + PREP_MINUTES * 60000
  const label = `Entregar até ${formatTime(deadline)}`

  if (now > deadline) {
    const lateMinutes = Math.floor((now - deadline) / 60000)
    return {
      state: 'late',
      label,
      detail: lateMinutes < 1 ? '⚠ atrasado' : `⚠ ${lateMinutes} min de atraso`,
    }
  }

  const remaining = Math.ceil((deadline - now) / 60000)
  return {
    state: remaining <= WARNING_MINUTES ? 'warning' : 'ok',
    label,
    detail: `faltam ${remaining} min`,
  }
}

function isOrderLate(order, now) {
  return getTiming(order, now).state === 'late'
}

export default function Kitchen() {
  const { unit } = useUnit()
  const [unitId, setUnitId] = useState(() => loadKitchenUnit(unit?.id ?? units[0].id))
  const [now, setNow] = useState(() => Date.now())
  const [updating, setUpdating] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [activeTab, setActiveTab] = useState('recebido')

  const fetchOrders = useCallback(() => getKitchenOrders(unitId), [unitId])
  const { data: orders, setData: setOrders, loading, error } = usePolling(fetchOrders, 3000)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(timer)
  }, [])

  const currentOrders = orders ?? []

  function handleUnitChange(e) {
    const newUnitId = e.target.value
    setUnitId(newUnitId)
    setOrders(null)
    try {
      localStorage.setItem(STORAGE_KEY, newUnitId)
    } catch {
      return
    }
  }

  async function handleAdvance(order, nextStatus) {
    setUpdating(order.id)
    setActionError(null)
    try {
      const updated = await updateOrderStatus(order.id, nextStatus)
      setOrders((prev) =>
        (prev ?? []).map((o) => (o.id === updated.id ? updated : o)).filter((o) => o.status !== 'retirado'),
      )
    } catch (err) {
      setActionError(`${order.id}: ${err.message}`)
    } finally {
      setUpdating(null)
    }
  }

  const unitName = units.find((u) => u.id === unitId)?.name

  return (
    <div className="kitchen">
      <header className="kitchen-header">
        <div>
          <h1>Painel da cozinha</h1>
          <p>
            {unitName} · Prazo de preparo: {PREP_MINUTES} min
          </p>
        </div>
        <div className="kitchen-header-actions">
          <label htmlFor="kitchen-unit" className="sr-only">
            Unidade
          </label>
          <select id="kitchen-unit" value={unitId} onChange={handleUnitChange}>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <Link to="/" className="kitchen-exit">
            Sair
          </Link>
        </div>
      </header>

      {actionError && (
        <div className="kitchen-alert" role="alert">
          {actionError}
        </div>
      )}

      {error && !orders && <div className="kitchen-alert">Não foi possível carregar os pedidos.</div>}

      {loading ? (
        <p className="kitchen-loading">Carregando pedidos...</p>
      ) : (
        <>
          <div className="kitchen-tabs" role="tablist">
            {columns.map((col) => {
              const tabOrders = currentOrders.filter((o) => o.status === col.status)
              const lateCount = tabOrders.filter((o) => isOrderLate(o, now)).length
              return (
                <button
                  key={col.status}
                  role="tab"
                  aria-selected={activeTab === col.status}
                  className={activeTab === col.status ? 'active' : ''}
                  onClick={() => setActiveTab(col.status)}
                >
                  {col.title} ({tabOrders.length})
                  {lateCount > 0 && <span className="tab-late">⚠ {lateCount} atrasado{lateCount > 1 ? 's' : ''}</span>}
                </button>
              )
            })}
          </div>

          <div className="kitchen-board">
            {columns.map((col) => {
              const columnOrders = currentOrders.filter((o) => o.status === col.status)
              const lateCount = columnOrders.filter((o) => isOrderLate(o, now)).length
              return (
                <section
                  key={col.status}
                  className={`kitchen-column ${activeTab === col.status ? 'visible' : ''}`}
                  aria-label={col.title}
                >
                  <h2>
                    {col.title} <span className="column-count">{columnOrders.length}</span>
                    {lateCount > 0 && (
                      <span className="column-late">
                        ⚠ {lateCount} atrasado{lateCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </h2>

                  {columnOrders.length === 0 && <p className="column-empty">Nenhum pedido</p>}

                  {columnOrders.map((order) => {
                    const timing = getTiming(order, now)
                    return (
                      <article key={order.id} className={`kitchen-card state-${timing.state}`}>
                        <div className="kitchen-card-timing">
                          <span>{timing.label}</span>
                          <strong>{timing.detail}</strong>
                        </div>
                        <div className="kitchen-card-body">
                          <div className="kitchen-card-header">
                            <strong>{order.id}</strong>
                            <span className="kitchen-channel">{channelLabels[order.channel] ?? order.channel}</span>
                          </div>
                          <p className="kitchen-customer">
                            {order.customer.name} · recebido às {formatTime(statusTime(order, 'recebido'))}
                          </p>
                          <ul className="kitchen-items">
                            {order.items.map((item) => (
                              <li key={item.id}>
                                <strong>{item.quantity}x</strong> {item.name}
                              </li>
                            ))}
                          </ul>
                          <button
                            className="btn kitchen-action"
                            onClick={() => handleAdvance(order, col.next)}
                            disabled={updating === order.id}
                          >
                            {updating === order.id ? 'Atualizando...' : col.action}
                          </button>
                        </div>
                      </article>
                    )
                  })}
                </section>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
