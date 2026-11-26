import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { formatPhone, onlyDigits } from '../utils/format'
import './Auth.css'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  password: '',
  confirmPassword: '',
  terms: false,
  loyalty: false,
  marketing: false,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(form) {
  const errors = {}

  if (form.name.trim().length < 3) {
    errors.name = 'Informe seu nome completo.'
  }
  if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Informe um e-mail válido.'
  }
  const phoneDigits = onlyDigits(form.phone)
  if (phoneDigits && phoneDigits.length < 10) {
    errors.phone = 'Celular incompleto.'
  }
  if (form.birthDate && new Date(form.birthDate) > new Date()) {
    errors.birthDate = 'Data de nascimento inválida.'
  }
  if (form.password.length < 8 || !/\d/.test(form.password) || !/[a-zA-Z]/.test(form.password)) {
    errors.password = 'A senha deve ter pelo menos 8 caracteres, com letras e números.'
  }
  if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'As senhas não conferem.'
  }
  if (!form.terms) {
    errors.terms = 'Para criar a conta é preciso aceitar os Termos de Uso e a Política de Privacidade.'
  }

  return errors
}

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/perfil'

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    let newValue = type === 'checkbox' ? checked : value
    if (name === 'phone') newValue = formatPhone(value)

    setForm((prev) => ({ ...prev, [name]: newValue }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const formErrors = validate(form)
    setErrors(formErrors)
    if (Object.keys(formErrors).length > 0) return

    setSubmitError('')
    setSubmitting(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: onlyDigits(form.phone),
        birthDate: form.birthDate,
        password: form.password,
        consents: { terms: form.terms, loyalty: form.loyalty, marketing: form.marketing },
      })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setSubmitError(err.message)
      setSubmitting(false)
    }
  }

  if (user && !submitting) {
    return <Navigate to="/perfil" replace />
  }

  return (
    <section className="auth-page">
      <div className="card auth-card auth-card-wide">
        <h1>Criar conta</h1>
        <p className="muted">Pedimos só o necessário. Os campos opcionais estão indicados.</p>

        <form onSubmit={handleSubmit} noValidate className="auth-form">
          <div className="field">
            <label htmlFor="name">Nome completo</label>
            <input id="name" name="name" autoComplete="name" value={form.name} onChange={handleChange} aria-invalid={!!errors.name} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="phone">
                Celular <span className="optional">(opcional)</span>
              </label>
              <input
                id="phone"
                name="phone"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="(81) 99999-9999"
                value={form.phone}
                onChange={handleChange}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <span className="field-error">{errors.phone}</span>}
            </div>
            <div className="field">
              <label htmlFor="birthDate">
                Nascimento <span className="optional">(opcional)</span>
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                autoComplete="bday"
                value={form.birthDate}
                onChange={handleChange}
                aria-invalid={!!errors.birthDate}
                aria-describedby="birth-help"
              />
              {errors.birthDate && <span className="field-error">{errors.birthDate}</span>}
            </div>
          </div>
          <small id="birth-help" className="muted field-help">
            A data de nascimento é usada apenas para benefícios de aniversário no programa de fidelidade.
          </small>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              aria-describedby="password-help"
            />
            {errors.password ? (
              <span className="field-error">{errors.password}</span>
            ) : (
              <small id="password-help" className="muted">
                Mínimo de 8 caracteres, com letras e números.
              </small>
            )}
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirmar senha</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
          </div>

          <fieldset className="consent-box">
            <legend>Privacidade e uso dos seus dados</legend>
            <p className="muted">
              Seguimos a Lei Geral de Proteção de Dados (LGPD). Você escolhe como seus dados são usados e pode mudar
              isso a qualquer momento no seu perfil.
            </p>

            <label className="consent-item">
              <input type="checkbox" name="terms" checked={form.terms} onChange={handleChange} aria-invalid={!!errors.terms} />
              <span>
                <strong>Li e aceito os Termos de Uso e a <Link to="/privacidade" target="_blank">Política de Privacidade</Link></strong>
                <span className="consent-tag required">obrigatório</span>
                <small>Necessário para criar a conta, processar pedidos e cumprir obrigações legais.</small>
              </span>
            </label>
            {errors.terms && <span className="field-error">{errors.terms}</span>}

            <label className="consent-item">
              <input type="checkbox" name="loyalty" checked={form.loyalty} onChange={handleChange} />
              <span>
                <strong>Quero participar do programa de fidelidade</strong>
                <span className="consent-tag">opcional</span>
                <small>Usamos seu histórico de pedidos para acumular pontos e liberar descontos.</small>
              </span>
            </label>

            <label className="consent-item">
              <input type="checkbox" name="marketing" checked={form.marketing} onChange={handleChange} />
              <span>
                <strong>Quero receber promoções personalizadas</strong>
                <span className="consent-tag">opcional</span>
                <small>Ofertas por e-mail e no app com base nas suas preferências e frequência de consumo.</small>
              </span>
            </label>
          </fieldset>

          {submitError && (
            <p className="form-error" role="alert">
              {submitError}
            </p>
          )}

          <button type="submit" className="btn" disabled={submitting}>
            {submitting ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="auth-switch">
          Já tem conta? <Link to="/entrar" state={location.state}>Entrar</Link>
        </p>
      </div>
    </section>
  )
}
