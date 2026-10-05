import { describe, expect, it } from 'vitest'
import { shouldShowPublicWorkingHour } from './public-hours-policy'

describe('public working hours', () => {
  it('keeps sample hours visible while sample services remain hidden', () => {
    expect(shouldShowPublicWorkingHour(true)).toBe(true)
    expect(shouldShowPublicWorkingHour(false)).toBe(true)
  })
})
