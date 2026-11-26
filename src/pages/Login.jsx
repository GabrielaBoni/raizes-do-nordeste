import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Auth.css'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/perfil'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha.')
      return
    }

    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  if (user && !submitting) {
    return <Navigate to="/perfil" replace />
  }

  return (
    <section className="auth-page">
      <div className="card auth-card">
        <h1>Entrar</h1>
        <p className="muted">Acesse sua conta para acompanhar pedidos e acumular pontos.</p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-switch">
          Ainda não tem conta? <Link to="/cadastro" state={location.state}>Cadastre-se</Link>
        </p>

        <div className="demo-note">
          <strong>Conta de demonstração:</strong> demo@raizes.com / raizes123
        </div>

        <p className="muted auth-guest">
          Você também pode fazer pedidos sem cadastro. A conta é necessária apenas para o programa de fidelidade e o
          histórico em outros dispositivos.
        </p>
      </div>
    </section>
  )
}
