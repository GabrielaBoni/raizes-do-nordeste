import { useState } from 'react'
import { AuthContext } from './AuthContext'
import * as authService from '../services/authService'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.getSessionUser)

  async function login(email, password) {
    const loggedUser = await authService.login(email, password)
    setUser(loggedUser)
    return loggedUser
  }

  async function register(data) {
    const newUser = await authService.register(data)
    setUser(newUser)
    return newUser
  }

  function logout() {
    authService.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>
}
