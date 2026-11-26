import { NavLink, Outlet, Link } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import UserMenu from '../components/UserMenu'
import './MainLayout.css'

const navItems = [
  { to: '/', label: 'Início', icon: '🏠' },
  { to: '/cardapio', label: 'Cardápio', icon: '📋' },
  { to: '/carrinho', label: 'Carrinho', icon: '🛒' },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
]

export default function MainLayout() {
  const { totalItems } = useCart()

  return (
    <div className="layout">
      <header className="layout-header">
        <Link to="/" className="brand">
          Raízes do Nordeste
        </Link>
        <nav className="nav-desktop">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'}>
              {item.label}
              {item.to === '/carrinho' && totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </NavLink>
          ))}
        </nav>
        <UserMenu />
      </header>

      <main className="layout-content">
        <Outlet />
        <footer className="layout-footer">
          <Link to="/privacidade">Política de Privacidade</Link>
          <span>© 2026 Raízes do Nordeste</span>
        </footer>
      </main>

      <nav className="nav-mobile">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            <span className="nav-icon">
              {item.icon}
              {item.to === '/carrinho' && totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
