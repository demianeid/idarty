export function safeNextPath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return fallback
  try {
    const url = new URL(value, 'https://idarty.invalid')
    if (url.origin !== 'https://idarty.invalid' || url.pathname !== value.split('?')[0].split('#')[0]) return fallback
    return value
  } catch {
    return fallback
  }
}
