import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './UserMenu.css'

export default function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open])

  if (!user) {
    return (
      <Link to="/entrar" className="header-user">
        Entrar
      </Link>
    )
  }

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/')
  }

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="header-user"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        Olá, {user.name.split(' ')[0]} <span className="user-menu-arrow">▾</span>
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-info">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          <Link to="/perfil" role="menuitem" onClick={() => setOpen(false)}>
            Meu perfil
          </Link>
          <Link to="/pedidos" role="menuitem" onClick={() => setOpen(false)}>
            Meus pedidos
          </Link>
          <Link to="/fidelidade" role="menuitem" onClick={() => setOpen(false)}>
            Fidelidade
          </Link>
          <button role="menuitem" className="user-menu-logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
