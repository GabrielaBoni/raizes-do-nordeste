import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMenuByUnit } from '../services/menuService'
import { useUnit } from '../contexts/UnitContext'
import { useCart } from '../contexts/CartContext'
import { formatPrice } from '../utils/format'
import { getCategoryPromotions } from '../services/promotionService'
import './Menu.css'

export default function Menu() {
  const { unit } = useUnit()
  const { addItem, decreaseItem, getQuantity, totalItems, subtotal } = useCart()
  const [menu, setMenu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)
  const [category, setCategory] = useState('todos')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!unit) return
    let active = true

    getMenuByUnit(unit.id)
      .then((data) => {
        if (active) setMenu(data)
      })
      .catch((err) => {
        if (active) setError(err.message || 'Não foi possível carregar o cardápio.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [unit, reload])

  function handleRetry() {
    setError(null)
    setLoading(true)
    setReload((n) => n + 1)
  }

  if (!unit) {
    return (
      <section>
        <h1>Cardápio</h1>
        <div className="card empty-state">
          <p>Você ainda não escolheu uma unidade. O cardápio e os preços variam de loja para loja.</p>
          <Link to="/" className="btn">
            Escolher unidade
          </Link>
        </div>
      </section>
    )
  }

  const term = search.trim().toLowerCase()
  const items = (menu?.items ?? []).filter((item) => {
    const matchCategory = category === 'todos' || item.category === category
    const matchSearch = !term || item.name.toLowerCase().includes(term)
    return matchCategory && matchSearch
  })
  const promoByCategory = Object.fromEntries(getCategoryPromotions(unit).map((promo) => [promo.discount.category, promo]))

  return (
    <section>
      <div className="menu-header">
        <div>
          <h1>Cardápio</h1>
          <p className="muted">
            {unit.name} · <Link to="/">trocar unidade</Link>
          </p>
        </div>
        {unit.kitchen === 'reduzida' && (
          <p className="menu-notice">
            Esta unidade opera com cozinha reduzida, por isso alguns pratos não aparecem aqui.
          </p>
        )}
      </div>

      {loading && <p className="muted">Carregando cardápio...</p>}

      {error && (
        <div className="card feedback-error">
          <p>{error}</p>
          <button className="btn" onClick={handleRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && menu && (
        <>
          <input
            type="search"
            className="menu-search"
            placeholder="Buscar no cardápio"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Buscar no cardápio"
          />

          <div className="category-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={category === 'todos'}
              className={category === 'todos' ? 'active' : ''}
              onClick={() => setCategory('todos')}
            >
              Todos
            </button>
            {menu.categories.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={category === c.id}
                className={category === c.id ? 'active' : ''}
                onClick={() => setCategory(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <p className="muted">Nenhum produto encontrado.</p>
          ) : (
            <ul className="product-list">
              {items.map((item) => (
                <li key={item.id} className={`card product-card ${item.available ? '' : 'unavailable'}`}>
                  {promoByCategory[item.category] && (
                    <span className="tag tag-promo">
                      −{promoByCategory[item.category].discount.value}% · {promoByCategory[item.category].title}
                    </span>
                  )}
                  <h3>{item.name}</h3>
                  <p className="muted">{item.description}</p>
                  <div className="product-footer">
                    <strong>{formatPrice(item.price)}</strong>
                    {!item.available ? (
                      <span className="tag tag-unavailable">Esgotado nesta unidade</span>
                    ) : getQuantity(item.id) > 0 ? (
                      <div className="qty-control">
                        <button onClick={() => decreaseItem(item.id)} aria-label={`Diminuir ${item.name}`}>
                          −
                        </button>
                        <span>{getQuantity(item.id)}</span>
                        <button onClick={() => addItem(item, unit.id)} aria-label={`Aumentar ${item.name}`}>
                          +
                        </button>
                      </div>
                    ) : (
                      <button className="btn btn-small" onClick={() => addItem(item, unit.id)}>
                        Adicionar
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}

          {totalItems > 0 && (
            <Link to="/carrinho" className="cart-bar">
              <span>
                Ver carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
              </span>
              <strong>{formatPrice(subtotal)}</strong>
            </Link>
          )}
        </>
      )}
    </section>
  )
}
