import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { requireTenantAccess } from '@/lib/authz'
export default async function DashboardLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  try {
    await requireTenantAccess(await headers(), slug)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') redirect(`/${locale}/login?next=/${locale}/tenants/${slug}/dashboard`)
    notFound()
  }
  return children
}
