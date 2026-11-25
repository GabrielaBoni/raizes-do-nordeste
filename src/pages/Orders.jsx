import { Link } from 'react-router-dom'
import { getOrders } from '../services/orderService'
import { usePolling } from '../hooks/usePolling'
import { activeStatuses } from '../data/orderStatus'
import { formatPrice, formatDateTime } from '../utils/format'
import StatusTag from '../components/StatusTag'
import OrderProgress from '../components/OrderProgress'
import './Orders.css'

function OrderCard({ order, showProgress }) {
  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <li>
      <Link to={`/pedidos/${order.id}`} className="card order-card">
        <div className="order-card-header">
          <strong>{order.id}</strong>
          <StatusTag status={order.status} />
        </div>
        <p className="muted">
          {order.unitName} · {formatDateTime(order.createdAt)}
        </p>
        {showProgress && <OrderProgress status={order.status} />}
        <div className="order-card-footer">
          <span>
            {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
          </span>
          <strong>{formatPrice(order.total)}</strong>
        </div>
      </Link>
    </li>
  )
}

export default function Orders() {
  const { data: orders, loading, error } = usePolling(getOrders)

  if (loading) {
    return (
      <section>
        <h1>Meus pedidos</h1>
        <p className="muted">Carregando pedidos...</p>
      </section>
    )
  }

  if (error && !orders) {
    return (
      <section>
        <h1>Meus pedidos</h1>
        <div className="card feedback-error">
          <p>Não foi possível carregar seus pedidos.</p>
        </div>
      </section>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <section>
        <h1>Meus pedidos</h1>
        <div className="card empty-state">
          <p>Você ainda não fez nenhum pedido.</p>
          <Link to="/cardapio" className="btn">
            Ver cardápio
          </Link>
        </div>
      </section>
    )
  }

  const active = orders.filter((o) => activeStatuses.includes(o.status))
  const finished = orders.filter((o) => !activeStatuses.includes(o.status))

  return (
    <section>
      <h1>Meus pedidos</h1>
      <p className="muted orders-hint">O status é atualizado automaticamente.</p>

      {active.length > 0 && (
        <>
          <h2 className="orders-section-title">Em andamento</h2>
          <ul className="order-list">
            {active.map((order) => (
              <OrderCard key={order.id} order={order} showProgress />
            ))}
          </ul>
        </>
      )}

      {finished.length > 0 && (
        <>
          <h2 className="orders-section-title">Histórico</h2>
          <ul className="order-list">
            {finished.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
