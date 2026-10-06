import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requirePlatformAdmin } from '@/lib/authz'

export default async function AdminLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  
  try {
    await requirePlatformAdmin(await headers())
  } catch (error) {
    redirect(`/${locale}/login`)
  }

  return (
    <div className="min-h-screen bg-surface text-[#172033]">
      <header className="sticky top-0 z-40 w-full border-b border-border bg-paper">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-6">
          <h1 className="text-xl font-bold tracking-tight text-brand-teal">Idarty Admin</h1>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        {children}
      </main>
    </div>
  )
}
