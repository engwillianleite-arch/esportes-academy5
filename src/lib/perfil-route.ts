import type { PerfilUsuario } from '@/types'

export function getRouteForPerfil(perfil: PerfilUsuario): string {
  if (perfil === 'responsavel') return '/pais'
  return '/painel'
}
