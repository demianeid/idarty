export function canMutateTenantResource(actorTenantId: string, resourceTenantId: string, isActive = true) {
  return isActive && actorTenantId === resourceTenantId
}

export function serviceEditPatch(durationMin: number, priceAmount: string) {
  return { durationMin, priceAmount, isSample: false as const }
}

export function staffEditPatch(email: string | null, phoneE164: string | null) {
  return { email, phoneE164, isSample: false as const }
}

export function staffAssignmentPatch() {
  return { isSample: false as const }
}
