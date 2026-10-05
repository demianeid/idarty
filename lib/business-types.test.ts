import { describe, expect, it } from 'vitest'
import { businessTypeLabel, defaultServicePreset, defaultServiceName, isBusinessType } from './business-types'

describe('business setup presets', () => {
  it('normalizes supported business types and falls back safely', () => {
    expect(isBusinessType('salon')).toBe(true)
    expect(isBusinessType('unknown')).toBe(false)
  })

  it('returns localized labels and useful service defaults', () => {
    expect(businessTypeLabel('barbershop', 'en')).toBe('Barbershop')
    expect(defaultServiceName('barbershop', 'ar')).toBe('قص شعر')
    expect(defaultServicePreset('salon')).toEqual({ durationMin: 60, priceAmount: '450' })
  })
})
