const DEFAULT_URLS = {
  production: 'https://esportesacademy.com.br',
  staging: 'https://staging.esportesacademy.com.br',
  development: 'http://localhost:3000',
} as const

function normalizeUrl(value?: string | null): string | null {
  const raw = value?.trim()
  if (!raw) return null
  return raw.replace(/\/+$/, '')
}

export function getAppUrl(): string {
  const configured =
    normalizeUrl(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeUrl(process.env.APP_URL)

  const runtimeEnv = (process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV ?? 'development').toLowerCase()
  const isProdLike = runtimeEnv === 'production' || runtimeEnv === 'prod' || runtimeEnv === 'staging'

  if (configured) {
    const isLocalhost = /localhost|127\.0\.0\.1/i.test(configured)
    if (!(isProdLike && isLocalhost)) return configured
  }

  if (runtimeEnv === 'staging') return DEFAULT_URLS.staging
  if (runtimeEnv === 'production' || runtimeEnv === 'prod') return DEFAULT_URLS.production
  return configured ?? DEFAULT_URLS.development
}
