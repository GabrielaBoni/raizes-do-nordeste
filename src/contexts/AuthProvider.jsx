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

  async function updateProfile(data) {
    const updated = await authService.updateProfile(user.id, data)
    setUser(updated)
    return updated
  }

  async function updateConsents(changes) {
    const updated = await authService.updateConsents(user.id, changes)
    setUser(updated)
    return updated
  }

  function exportData() {
    return authService.exportUserData(user.id)
  }

  async function deleteAccount(password) {
    await authService.deleteAccount(user.id, password)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, updateConsents, exportData, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  )
}
