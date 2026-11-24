import { createContext, useContext } from 'react'

export const UnitContext = createContext(null)

export function useUnit() {
  return useContext(UnitContext)
}
