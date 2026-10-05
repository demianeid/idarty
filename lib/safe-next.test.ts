import { describe, expect, it } from 'vitest'
import { safeNextPath } from './safe-next'

describe('safeNextPath', () => {
  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)'])('rejects %s', (value) => {
    expect(safeNextPath(value, '/ar/dashboard')).toBe('/ar/dashboard')
  })

  it('accepts a same-origin relative path', () => {
    expect(safeNextPath('/ar/dashboard?tab=bookings', '/ar/dashboard')).toBe('/ar/dashboard?tab=bookings')
  })
})
