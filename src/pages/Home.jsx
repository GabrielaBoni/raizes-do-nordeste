import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUnits } from '../services/unitService'
import { useUnit } from '../contexts/UnitContext'
import { useCart } from '../contexts/CartContext'
import './Home.css'

export default function Home() {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reload, setReload] = useState(0)
  const { unit: selectedUnit, selectUnit } = useUnit()
  const { items, unitId: cartUnitId, clearCart } = useCart()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    getUnits()
      .then((data) => {
        if (active) setUnits(data)
      })
      .catch(() => {
        if (active) setError('Não foi possível carregar as unidades.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reload])

  function handleRetry() {
    setError(null)
    setLoading(true)
    setReload((n) => n + 1)
  }

  function handleSelect(unit) {
    if (items.length > 0 && cartUnitId !== unit.id) {
      const confirmed = window.confirm(
        'Seu carrinho tem itens de outra unidade. Ao trocar de unidade o carrinho será esvaziado. Deseja continuar?',
      )
      if (!confirmed) return
      clearCart()
    }
    selectUnit(unit)
    navigate('/cardapio')
  }

  return (
    <section>
      <div className="home-hero">
        <h1>Sabor do Nordeste, do jeito que você conhece</h1>
        <p>Escolha a unidade mais perto de você para ver o cardápio e fazer seu pedido.</p>
      </div>

      <h2>Unidades</h2>

      {loading && <p className="muted">Carregando unidades...</p>}

      {error && (
        <div className="card feedback-error">
          <p>{error}</p>
          <button className="btn" onClick={handleRetry}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && (
        <ul className="unit-list">
          {units.map((unit) => {
            const isSelected = selectedUnit?.id === unit.id
            return (
              <li key={unit.id} className={`card unit-card ${isSelected ? 'selected' : ''}`}>
                <div className="unit-info">
                  <h3>{unit.name}</h3>
                  <p className="muted">{unit.address} · {unit.city}/{unit.state}</p>
                  <p className="muted">Horário: {unit.openingHours}</p>
                  <span className={`tag ${unit.kitchen === 'completa' ? 'tag-full' : 'tag-reduced'}`}>
                    Cozinha {unit.kitchen}
                  </span>
                </div>
                <button className={isSelected ? 'btn' : 'btn btn-outline'} onClick={() => handleSelect(unit)}>
                  {isSelected ? 'Ver cardápio' : 'Escolher unidade'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
