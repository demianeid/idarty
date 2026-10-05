import Dashboard from '@/app/page'

export default async function LocalePage({ params }: { params: Promise<{ locale: 'ar' | 'en' }> }) {
  const { locale } = await params
  return <Dashboard locale={locale} />
}
