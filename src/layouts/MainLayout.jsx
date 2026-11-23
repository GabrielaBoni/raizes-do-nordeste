import { NavLink, Outlet, Link } from 'react-router-dom'
import './MainLayout.css'

const navItems = [
  { to: '/', label: 'Início', icon: '🏠' },
  { to: '/cardapio', label: 'Cardápio', icon: '📋' },
  { to: '/carrinho', label: 'Carrinho', icon: '🛒' },
  { to: '/pedidos', label: 'Pedidos', icon: '🧾' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
]

export default function MainLayout() {
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
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="layout-content">
        <Outlet />
      </main>

      <nav className="nav-mobile">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
