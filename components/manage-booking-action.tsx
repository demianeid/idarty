'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { cancelPublicBooking } from '@/app/[locale]/manage-booking/actions'

export function ManageBookingAction({ locale, token }: { locale: 'ar' | 'en'; token: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return <button type="button" disabled={pending} onClick={() => startTransition(async () => { const result = await cancelPublicBooking({ locale, token }); if (result.ok) router.refresh() })} className="mt-7 h-11 rounded-xl border border-[#f0c8c8] px-4 text-sm font-semibold text-[#b42318] disabled:opacity-50">{pending ? '...' : locale === 'ar' ? 'إلغاء الموعد' : 'Cancel appointment'}</button>
}
