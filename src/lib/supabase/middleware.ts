import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import type { PerfilUsuario } from '@/types'
import { getModuloFromPath, hasModuloAccess } from '@/lib/modulo-access'

// Routes where super_admin must be bypassed and sent to /superadmin
const ESCOLA_FLOW_ROUTES = ['/selecionar-escola']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — IMPORTANT: do not add logic between createServerClient and getUser()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  // On network/auth error, fail open (don't redirect) to avoid locking out users during outages
  if (error) {
    console.error('[proxy] supabase.auth.getUser error:', error.message)
    return supabaseResponse
  }

  // Super_admin bypass: redirect to /superadmin from any escola flow route
  // Uses the anon client with user session — RLS allows users to see their own plataforma_usuarios row
  if (user) {
    const path = request.nextUrl.pathname
    const isEscolaFlowRoute = ESCOLA_FLOW_ROUTES.some((r) => path === r || path.startsWith(r + '/'))
    const isRootRoute = path === '/'
    if (isEscolaFlowRoute || isRootRoute) {
      const { data: plataformaRow } = await supabase
        .from('plataforma_usuarios')
        .select('ativo, deleted_at')
        .eq('user_id', user.id)
        .maybeSingle()

      if (plataformaRow?.ativo && !plataformaRow.deleted_at) {
        const url = request.nextUrl.clone()
        url.pathname = '/superadmin'
        return NextResponse.redirect(url)
      }
    }
  }

  // Redirect authenticated users without escola context away from /painel
  if (user && request.nextUrl.pathname.startsWith('/painel')) {
    const escolaId = request.cookies.get('ea-escola-id')?.value
    if (!escolaId) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  if (user && request.nextUrl.pathname.startsWith('/professor')) {
    const escolaId = request.cookies.get('ea-escola-id')?.value
    const perfil = request.cookies.get('ea-perfil')?.value
    if (!escolaId || perfil !== 'professor') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Module feature flag + permission matrix enforcement (Story 1.6)
  if (user && request.nextUrl.pathname.startsWith('/painel/')) {
    const escolaId = request.cookies.get('ea-escola-id')?.value
    const perfil = request.cookies.get('ea-perfil')?.value
    const modulo = getModuloFromPath(request.nextUrl.pathname)

    if (modulo && escolaId) {
      // 1. Permission matrix check — DB-driven (Story 8.1), falls back to static matrix
      let hasAccess = false
      if (!perfil) {
        hasAccess = false
      } else {
        const { data: permRow } = await supabase
          .from('perfil_modulo_acesso')
          .select('ativo')
          .eq('modulo_slug', modulo)
          .eq('perfil', perfil)
          .maybeSingle()

        // If DB row exists, use its value; otherwise fall back to static PERMISSION_MATRIX
        hasAccess = permRow != null ? permRow.ativo : hasModuloAccess(modulo, perfil as PerfilUsuario)
      }

      if (!hasAccess) {
        const url = request.nextUrl.clone()
        url.pathname = '/painel/sem-permissao'
        return NextResponse.redirect(url)
      }

      // 2. Module active check (DB — is_module_active handles expiry via expira_em)
      const { data: isActive, error: rpcError } = await supabase.rpc('is_module_active', {
        p_escola_id: escolaId,
        p_modulo_slug: modulo,
      })
      if (rpcError) {
        console.error('[proxy] is_module_active RPC error:', rpcError.message)
      }
      if (!isActive) {
        const url = request.nextUrl.clone()
        url.pathname = '/painel/modulo-bloqueado'
        url.searchParams.set('modulo', modulo)
        return NextResponse.redirect(url)
      }
    }
  }

  // Redirect authenticated users away from /login → only if they have an escola cookie
  // (avoids loop: authenticated user with no escola context bouncing between / and /login)
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const escolaId = request.cookies.get('ea-escola-id')?.value
    if (escolaId) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    // No escola cookie — let page.tsx handle the routing to avoid loops
  }

  // Redirect unauthenticated users to /login for all routes except /login and /auth/**
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
