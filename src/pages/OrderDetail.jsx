import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrderById } from '../services/orderService'
import { usePolling } from '../hooks/usePolling'
import { orderStatus } from '../data/orderStatus'
import { formatPrice, formatDateTime } from '../utils/format'
import StatusTag from '../components/StatusTag'
import OrderProgress from '../components/OrderProgress'
import './Orders.css'

const methodLabels = {
  pix: 'Pix',
  cartao: 'Cartão de crédito',
}

const statusMessages = {
  aguardando_pagamento: 'Ainda não recebemos a confirmação do pagamento deste pedido.',
  pagamento_recusado: 'O pagamento deste pedido foi recusado. Nenhum valor foi cobrado.',
  recebido: 'Recebemos seu pedido e ele já está na fila da cozinha.',
  em_preparo: 'A cozinha está preparando seu pedido.',
  retirado: 'Pedido retirado. Bom apetite!',
  cancelado: 'Este pedido foi cancelado.',
}

export default function OrderDetail() {
  const { id } = useParams()
  const fetchOrder = useCallback(() => getOrderById(id), [id])
  const { data: order, loading, error } = usePolling(fetchOrder)

  if (loading) {
    return (
      <section>
        <p className="muted">Carregando pedido...</p>
      </section>
    )
  }

  if (error && !order) {
    return (
      <section>
        <h1>Pedido não encontrado</h1>
        <div className="card empty-state">
          <p>Não encontramos o pedido {id}.</p>
          <Link to="/pedidos" className="btn">
            Ver meus pedidos
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="order-detail">
      <Link to="/pedidos" className="back-link">
        ← Meus pedidos
      </Link>

      <div className="order-detail-header">
        <h1>Pedido {order.id}</h1>
        <StatusTag status={order.status} />
      </div>

      <div className="card order-status-card">
        <OrderProgress status={order.status} />
        {order.status === 'pronto' ? (
          <div className="ready-banner" role="status">
            <strong>Seu pedido está pronto!</strong>
            <span>
              Retire no balcão da unidade {order.unitName} informando o número {order.id} ou o nome{' '}
              {order.customer.name}.
            </span>
          </div>
        ) : (
          <p className="order-status-message">{statusMessages[order.status]}</p>
        )}
      </div>

      <div className="order-detail-grid">
        <div className="card">
          <h2>Itens</h2>
          <ul className="detail-items">
            {order.items.map((item) => (
              <li key={item.id}>
                <span>
                  {item.quantity}x {item.name}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {order.discounts?.length > 0 && (
            <>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discounts.map((discount) => (
                <div key={discount.id} className="summary-row summary-discount">
                  <span>{discount.label}</span>
                  <span>− {formatPrice(discount.amount)}</span>
                </div>
              ))}
            </>
          )}
          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>
          {order.loyalty?.settled && order.loyalty.pointsToEarn > 0 && (
            <p className="order-points">⭐ +{order.loyalty.pointsToEarn} pontos de fidelidade</p>
          )}
        </div>

        <div className="card">
          <h2>Informações</h2>
          <dl className="detail-info">
            <dt>Unidade</dt>
            <dd>{order.unitName}</dd>
            <dt>Nome para chamada</dt>
            <dd>{order.customer.name}</dd>
            <dt>Feito em</dt>
            <dd>{formatDateTime(order.createdAt)}</dd>
            {order.payment && (
              <>
                <dt>Pagamento</dt>
                <dd>
                  {methodLabels[order.payment.method]}
                  {order.payment.cardLastDigits && ` final ${order.payment.cardLastDigits}`}
                </dd>
                <dt>Transação</dt>
                <dd>{order.payment.transactionId}</dd>
              </>
            )}
          </dl>
        </div>

        <div className="card">
          <h2>Histórico</h2>
          <ol className="history-list">
            {[...order.history].reverse().map((entry, index) => (
              <li key={index}>
                <span>{orderStatus[entry.status]?.label ?? entry.status}</span>
                <span className="muted">{formatDateTime(entry.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
