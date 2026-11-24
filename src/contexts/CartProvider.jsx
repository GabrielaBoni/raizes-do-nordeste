import { useState } from 'react'
import { CartContext } from './CartContext'

const STORAGE_KEY = 'raizes:carrinho'
const EMPTY_CART = { unitId: null, items: [] }

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : EMPTY_CART
  } catch {
    return EMPTY_CART
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  } catch {
    return
  }
}

export default function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart)

  function update(newCart) {
    setCart(newCart)
    saveCart(newCart)
  }

  function addItem(product, unitId) {
    const items = cart.unitId === unitId ? cart.items : []
    const existing = items.find((item) => item.id === product.id)

    const newItems = existing
      ? items.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      : [...items, { id: product.id, name: product.name, price: product.price, quantity: 1 }]

    update({ unitId, items: newItems })
  }

  function decreaseItem(productId) {
    const newItems = cart.items
      .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
      .filter((item) => item.quantity > 0)

    update({ ...cart, items: newItems })
  }

  function removeItem(productId) {
    update({ ...cart, items: cart.items.filter((item) => item.id !== productId) })
  }

  function clearCart() {
    update(EMPTY_CART)
  }

  function getQuantity(productId) {
    return cart.items.find((item) => item.id === productId)?.quantity ?? 0
  }

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items: cart.items,
        unitId: cart.unitId,
        totalItems,
        subtotal,
        addItem,
        decreaseItem,
        removeItem,
        clearCart,
        getQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
