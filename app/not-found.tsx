import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-6">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-ink">404</h1>
        <p className="mt-4 text-ink-muted">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="mt-8 inline-flex rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d6560]"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
