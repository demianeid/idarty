'use client'

import { authClient } from '@/lib/auth-client'

export function SignOutButton({ label }: { label: string }) {
  async function signOut() {
    await authClient.signOut()
    window.location.href = '/'
  }
  return <button type="button" onClick={signOut} className="rounded-xl border border-[#dfe4ee] px-4 py-2 text-sm font-semibold text-[#516078] transition hover:border-brand-teal hover:text-brand-teal">{label}</button>
}
