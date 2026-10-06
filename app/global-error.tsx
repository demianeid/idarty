'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-surface">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h2 className="text-xl font-semibold text-ink">Something went wrong</h2>
            <p className="mt-2 text-sm text-ink-muted">An unexpected error occurred. Please try again.</p>
            <button
              onClick={reset}
              className="mt-6 rounded-xl bg-brand-teal px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0d6560]"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
