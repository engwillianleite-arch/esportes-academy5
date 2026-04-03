import type { ModuloSlug, PerfilUsuario, PlanoTipo } from '@/types'

// ─── Module Active Rule (Story 8.3) ──────────────────────────────────────────
// A module is considered ACTIVE for a school when:
//   escola_modulos.ativo = true AND (expira_em IS NULL OR expira_em > now())
// This rule is enforced by:
//   1. RPC `is_module_active` (middleware, server-side checks)
//   2. View `modulos_ativos` (client-side queries)
// Never check `ativo` alone — always go through `is_module_active` or `modulos_ativos`.

// ─── Permission Matrix ────────────────────────────────────────────────────────
// Defines which profiles can access each module.
// Story 8.1 made this DB-driven via `perfil_modulo_acesso` table (super_admin editable).
// This static matrix is kept as a fallback when the DB table has no row for a given pair.

export const PERMISSION_MATRIX: Record<ModuloSlug, PerfilUsuario[]> = {
  administrativo:       ['admin_escola', 'coordenador', 'professor', 'financeiro', 'secretaria', 'saude', 'marketing'],
  financeiro:           ['admin_escola', 'coordenador', 'financeiro'],
  comunicacao_basica:   ['admin_escola', 'coordenador', 'secretaria', 'marketing'],
  saude:                ['admin_escola', 'coordenador', 'saude'],
  eventos:              ['admin_escola', 'coordenador', 'secretaria', 'marketing', 'professor'],
  treinamentos:         ['admin_escola', 'coordenador', 'professor'],
  comunicacao_avancada: ['admin_escola', 'coordenador', 'marketing'],
  relatorios:           ['admin_escola', 'coordenador', 'financeiro'],
  competicoes:          ['admin_escola', 'coordenador', 'professor'],
  metodologia:          ['admin_escola', 'coordenador', 'professor'],
  cursos:               ['admin_escola', 'coordenador', 'professor', 'secretaria', 'saude', 'marketing', 'financeiro'],
}

// ─── Plan → Module Map ────────────────────────────────────────────────────────
// Defines which modules are included per plan tier.
// Used by Epic 2 school registration and Epic 8 plan changes to seed escola_modulos.
// FRs: 29, 31, 36–53

export const PLAN_MODULES: Record<PlanoTipo, ModuloSlug[]> = {
  starter: [
    'administrativo',
    'financeiro',
    'comunicacao_basica',
  ],
  premium: [
    'administrativo',
    'financeiro',
    'comunicacao_basica',
    'saude',
    'eventos',
    'treinamentos',
    'comunicacao_avancada',
    'relatorios',
  ],
  pro: [
    'administrativo',
    'financeiro',
    'comunicacao_basica',
    'saude',
    'eventos',
    'treinamentos',
    'comunicacao_avancada',
    'relatorios',
  ],
  enterprise: [
    'administrativo',
    'financeiro',
    'comunicacao_basica',
    'saude',
    'eventos',
    'treinamentos',
    'comunicacao_avancada',
    'relatorios',
    'competicoes',
    'metodologia',
    'cursos',
  ],
}

// ─── Route → Module Map ───────────────────────────────────────────────────────
// Maps URL path segments under /painel/ to their ModuloSlug.
// 'administrativo' is intentionally excluded — it is the default module and all
// authenticated /painel users have access without an explicit module route check.

export const MODULO_ROUTES: Record<string, ModuloSlug> = {
  financeiro:             'financeiro',
  saude:                  'saude',
  eventos:                'eventos',
  treinamentos:           'treinamentos',
  'comunicacao-basica':   'comunicacao_basica',
  'comunicacao-avancada': 'comunicacao_avancada',
  relatorios:             'relatorios',
  competicoes:            'competicoes',
  metodologia:            'metodologia',
  cursos:                 'cursos',
}

// Segments under /painel/ that are NOT module routes and must never be intercepted.
// 'administrativo' is intentionally open to all authenticated escola users — no plan or
// profile restriction applies; the super_admin manages admin capabilities separately.
const NON_MODULE_SEGMENTS = new Set([
  'administrativo',
  'modulo-bloqueado',
  'sem-permissao',
  'configuracoes',
])

// ─── Helper functions ─────────────────────────────────────────────────────────

/**
 * Returns the ModuloSlug for the given pathname, or null if the path is not
 * a module-specific route (e.g. /painel, /painel/modulo-bloqueado, /painel/configuracoes).
 *
 * Examples:
 *   /painel/financeiro/relatorios  → 'financeiro'
 *   /painel/saude                  → 'saude'
 *   /painel                        → null
 *   /painel/modulo-bloqueado       → null
 */
export function getModuloFromPath(pathname: string): ModuloSlug | null {
  // ['', 'painel', 'financeiro', ...]
  const parts = pathname.split('/')
  const segment = parts[2] // first segment after /painel/
  if (!segment || NON_MODULE_SEGMENTS.has(segment)) return null
  return MODULO_ROUTES[segment] ?? null
}

/**
 * FALLBACK: Returns true if the given perfil is allowed to access the given module
 * according to the static PERMISSION_MATRIX.
 *
 * The middleware (Story 8.1/8.4) checks the DB table `perfil_modulo_acesso` first.
 * This function is only called when no DB row is found (empty table / DB unreachable).
 * Do NOT call this directly for access decisions — use `is_module_active` RPC or
 * the middleware logic which applies the DB-driven check with this as fallback.
 */
export function hasModuloAccess(modulo: ModuloSlug, perfil: PerfilUsuario): boolean {
  return PERMISSION_MATRIX[modulo]?.includes(perfil) ?? false
}
