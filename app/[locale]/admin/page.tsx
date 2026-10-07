import { headers } from 'next/headers'
import { db } from '@/lib/db'
import { tenants, memberships, user } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requirePlatformAdmin } from '@/lib/authz'
import { TenantAdminActions } from './tenant-admin-actions'

export default async function AdminPage() {
  await requirePlatformAdmin(await headers())
  // Fetch all tenants with their owner's info
  const allTenants = await db
    .select({
      id: tenants.id,
      slug: tenants.slug,
      status: tenants.status,
      plan: tenants.plan,
      businessType: tenants.businessType,
      createdAt: tenants.createdAt,
      ownerEmail: user.email,
      ownerName: user.name,
    })
    .from(tenants)
    .leftJoin(memberships, eq(tenants.id, memberships.tenantId))
    .leftJoin(user, eq(memberships.userId, user.id))
    .where(eq(memberships.role, 'owner'))
    .orderBy(desc(tenants.createdAt))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Platform Tenants</h2>
        <div className="text-sm text-ink-muted">Total: {allTenants.length}</div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border bg-paper shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface text-ink-muted">
              <tr>
                <th className="px-6 py-4 font-semibold">Tenant</th>
                <th className="px-6 py-4 font-semibold">Owner</th>
                <th className="px-6 py-4 font-semibold">Created At</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Plan</th>
                <th className="px-6 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7eaf0]">
              {allTenants.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-surface/50">
                  <td className="px-6 py-4">
                    <div className="font-semibold">{t.slug}</div>
                    <div className="text-xs text-ink-muted">{t.businessType}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{t.ownerName}</div>
                    <div className="text-ink-muted">{t.ownerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-ink-muted">
                    {t.createdAt.toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      t.status === 'active' ? 'bg-[#dff5e9] text-[#24865b]' :
                      t.status === 'suspended' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      t.plan === 'pro' ? 'bg-purple-100 text-purple-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {t.plan.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <TenantAdminActions tenantId={t.id} currentStatus={t.status} currentPlan={t.plan} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
