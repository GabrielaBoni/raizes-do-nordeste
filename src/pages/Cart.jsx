import { Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useUnit } from '../contexts/UnitContext'
import { useAuth } from '../contexts/AuthContext'
import { getOrdersByUser } from '../services/orderService'
import { calculateQuote } from '../services/promotionService'
import { formatPrice } from '../utils/format'
import './Cart.css'

export default function Cart() {
  const { items, totalItems, subtotal, addItem, decreaseItem, removeItem, clearCart, unitId } = useCart()
  const { unit } = useUnit()
  const { user } = useAuth()

  if (items.length === 0) {
    return (
      <section>
        <h1>Carrinho</h1>
        <div className="card empty-state">
          <p>Seu carrinho está vazio.</p>
          <Link to="/cardapio" className="btn">
            Ver cardápio
          </Link>
        </div>
      </section>
    )
  }

  const quote = calculateQuote({ items, unit, user, orderHistory: user ? getOrdersByUser(user.id) : [] })

  return (
    <section>
      <h1>Carrinho</h1>
      {unit && unit.id === unitId && <p className="muted cart-unit">Retirada em {unit.name}</p>}

      <div className="cart-layout">
        <ul className="cart-list">
          {items.map((item) => (
            <li key={item.id} className="card cart-item">
              <div className="cart-item-info">
                <h3>{item.name}</h3>
                <p className="muted">{formatPrice(item.price)} cada</p>
              </div>

              <div className="cart-item-actions">
                <div className="qty-control">
                  <button onClick={() => decreaseItem(item.id)} aria-label={`Diminuir ${item.name}`}>
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => addItem(item, unitId)} aria-label={`Aumentar ${item.name}`}>
                    +
                  </button>
                </div>
                <strong>{formatPrice(item.price * item.quantity)}</strong>
                <button className="link-button" onClick={() => removeItem(item.id)}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card cart-summary">
          <h2>Resumo</h2>
          <div className="summary-row">
            <span>Itens</span>
            <span>{totalItems}</span>
          </div>
          {quote.discounts.length > 0 && (
            <>
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {quote.discounts.map((discount) => (
                <div key={discount.id} className="summary-row summary-discount">
                  <span>{discount.label}</span>
                  <span>− {formatPrice(discount.amount)}</span>
                </div>
              ))}
            </>
          )}
          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>{formatPrice(quote.total)}</strong>
          </div>
          <p className="muted cart-coupon-hint">Tem cupom ou pontos? Você aplica na próxima etapa.</p>
          <Link to="/checkout" className="btn">
            Finalizar pedido
          </Link>
          <Link to="/cardapio" className="btn btn-outline">
            Continuar comprando
          </Link>
          <button className="link-button" onClick={clearCart}>
            Esvaziar carrinho
          </button>
        </aside>
      </div>
    </section>
  )
}
