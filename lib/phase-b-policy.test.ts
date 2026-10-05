import { describe, expect, it } from 'vitest'
import { canMutateTenantResource, serviceEditPatch, staffAssignmentPatch, staffEditPatch } from './phase-b-policy'

describe('Phase B mutation policy', () => {
  it('clears is_sample for service edits, staff edits, and assignments', () => {
    expect(serviceEditPatch(30, '10.00').isSample).toBe(false)
    expect(staffEditPatch('a@example.com', null).isSample).toBe(false)
    expect(staffAssignmentPatch().isSample).toBe(false)
  })

  it.each([
    ['same tenant', 'tenant-a', 'tenant-a', true, true],
    ['other tenant', 'tenant-a', 'tenant-b', true, false],
    ['inactive resource', 'tenant-a', 'tenant-a', false, false],
  ])('%s cannot bypass tenant ownership or active checks', (_label, actor, resource, active, allowed) => {
    expect(canMutateTenantResource(actor, resource, active)).toBe(allowed)
  })
})
