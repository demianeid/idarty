'use client'

import { useTransition } from 'react'
import { updateTenantStatus, updateTenantPlan } from './actions'

export function TenantAdminActions({ tenantId, currentStatus, currentPlan }: { tenantId: string, currentStatus: string, currentPlan: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        disabled={isPending}
        value={currentStatus}
        onChange={(e) => {
          startTransition(() => {
            updateTenantStatus(tenantId, e.target.value as any)
          })
        }}
        className="rounded-lg border border-border bg-paper px-2 py-1 text-xs font-medium outline-none transition focus:border-brand-teal disabled:opacity-50"
      >
        <option value="active">Active</option>
        <option value="suspended">Suspended</option>
        <option value="archived">Archived</option>
      </select>

      <select
        disabled={isPending}
        value={currentPlan}
        onChange={(e) => {
          startTransition(() => {
            updateTenantPlan(tenantId, e.target.value)
          })
        }}
        className="rounded-lg border border-border bg-paper px-2 py-1 text-xs font-medium outline-none transition focus:border-brand-teal disabled:opacity-50"
      >
        <option value="free">Free</option>
        <option value="trial">Trial</option>
        <option value="pro">Pro</option>
      </select>
    </div>
  )
}
