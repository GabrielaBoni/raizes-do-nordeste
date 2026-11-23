import { units } from '../data/units'
import { products, categories } from '../data/products'
import { simulateRequest, ApiError } from './api'

function isInSeason(product, month) {
  if (!product.seasonalMonths) return true
  return product.seasonalMonths.includes(month)
}

function canBePrepared(product, unit) {
  if (product.requiresFullKitchen && unit.kitchen !== 'completa') return false
  return true
}

function priceForRegion(product, region) {
  return product.regionalPrices?.[region] ?? product.price
}

export function getMenuByUnit(unitId, date = new Date()) {
  return simulateRequest(() => {
    const unit = units.find((u) => u.id === unitId)
    if (!unit) {
      throw new ApiError('Unidade não encontrada', 404)
    }

    const month = date.getMonth() + 1

    const items = products
      .filter((p) => isInSeason(p, month) && canBePrepared(p, unit))
      .map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        price: priceForRegion(p, unit.region),
        available: !p.outOfStockIn?.includes(unit.id),
      }))

    const menuCategories = categories.filter((c) =>
      items.some((item) => item.category === c.id),
    )

    return { unit, categories: menuCategories, items }
  })
}
