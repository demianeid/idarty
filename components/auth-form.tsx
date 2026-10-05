'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export function AuthForm({ mode, locale = 'ar', nextPath = `/${locale}/dashboard` }: { mode: 'login' | 'signup'; locale?: 'ar' | 'en'; nextPath?: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    const result = mode === 'login'
      ? await authClient.signIn.email({ email, password })
      : await authClient.signUp.email({ name, email, password })
    setPending(false)
    if (result.error) {
      setError('تعذر إتمام العملية. تحقق من البيانات وحاول مرة أخرى.')
      return
    }
    if (mode === 'signup') {
      router.push(`/${locale}/verify-email?email=${encodeURIComponent(email)}`)
    } else {
      router.push(nextPath)
    }
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#f7f8f6] px-6 py-10 text-[#17211e]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col justify-center">
        <Link href="/" className="mb-10 text-sm font-bold tracking-[0.18em] text-[#167c72]">IDARTY</Link>
        <div className="rounded-3xl border border-[#dce5df] bg-white p-7 shadow-[0_24px_70px_rgba(28,51,44,0.08)]">
          <p className="mb-2 text-sm font-semibold text-[#167c72]">مساحة عمل هادئة وآمنة</p>
          <h1 className="text-3xl font-semibold tracking-tight">{mode === 'login' ? 'مرحباً بعودتك' : 'أنشئ حسابك'}</h1>
          <p className="mt-2 text-sm leading-6 text-[#65736d]">{mode === 'login' ? 'سجّل الدخول لإدارة مساحة عملك.' : 'ابدأ بإدارة فريقك وحجوزاتك من مكان واحد.'}</p>
          <form onSubmit={submit} className="mt-7 space-y-4">
            {mode === 'signup' && <label className="block text-sm font-medium">الاسم<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d7e1db] px-4 py-3 outline-none focus:border-[#167c72]" /></label>}
            <label className="block text-sm font-medium">البريد الإلكتروني<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d7e1db] px-4 py-3 outline-none focus:border-[#167c72]" /></label>
            <label className="block text-sm font-medium">كلمة المرور<input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-[#d7e1db] px-4 py-3 outline-none focus:border-[#167c72]" /></label>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button disabled={pending} className="w-full rounded-xl bg-[#167c72] px-4 py-3 font-semibold text-white transition hover:bg-[#12675f] disabled:opacity-60">{pending ? 'جارٍ المعالجة...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}</button>
          </form>
          <p className="mt-6 text-center text-sm text-[#65736d]">{mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}<Link className="font-semibold text-[#167c72]" href={mode === 'login' ? '/signup' : '/login'}>{mode === 'login' ? 'أنشئ حساباً' : 'سجّل الدخول'}</Link></p>
        </div>
      </div>
    </main>
  )
}

export default AuthForm
