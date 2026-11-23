import { units } from '../data/units'
import { simulateRequest, ApiError } from './api'

export function getUnits() {
  return simulateRequest(() => units)
}

export function getUnitById(unitId) {
  return simulateRequest(() => {
    const unit = units.find((u) => u.id === unitId)
    if (!unit) {
      throw new ApiError('Unidade não encontrada', 404)
    }
    return unit
  })
}
