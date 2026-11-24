import { useState } from 'react'
import { UnitContext } from './UnitContext'

const STORAGE_KEY = 'raizes:unidade'

function loadUnit() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export default function UnitProvider({ children }) {
  const [unit, setUnit] = useState(loadUnit)

  function selectUnit(newUnit) {
    setUnit(newUnit)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUnit))
    } catch {
      return
    }
  }

  return (
    <UnitContext.Provider value={{ unit, selectUnit }}>
      {children}
    </UnitContext.Provider>
  )
}
