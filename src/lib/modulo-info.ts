import type { ModuloSlug, PlanoTipo } from '@/types'
import { MODULO_ROUTES } from '@/lib/modulo-access'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ModuloStatusItem = {
  slug: ModuloSlug
  status: 'active' | 'locked-plan' | 'locked-permission'
}

// ─── Module Metadata ──────────────────────────────────────────────────────────

export const MODULO_INFO: Record<ModuloSlug, { label: string; description: string; minPlan: PlanoTipo }> = {
  administrativo: {
    label: 'Administrativo',
    description: 'Gestão central da escola: configurações, usuários e visão geral.',
    minPlan: 'starter',
  },
  financeiro: {
    label: 'Financeiro',
    description: 'Cobranças automáticas, integração Asaas, relatórios financeiros e controle de inadimplência.',
    minPlan: 'starter',
  },
  comunicacao_basica: {
    label: 'Comunicação Básica',
    description: 'Push notifications no app Esportes Academy, e-mails transacionais e mural de avisos.',
    minPlan: 'starter',
  },
  saude: {
    label: 'Saúde',
    description: 'Ficha médica dos atletas, histórico de lesões, documentos de aptidão física e avaliações.',
    minPlan: 'pro',
  },
  eventos: {
    label: 'Eventos',
    description: 'Criação e gestão de eventos, RSVP de responsáveis, check-in no dia e galeria de fotos.',
    minPlan: 'pro',
  },
  treinamentos: {
    label: 'Treinamentos',
    description: 'Planos de treino com periodização, planos de aula para professores e métricas de evolução.',
    minPlan: 'pro',
  },
  comunicacao_avancada: {
    label: 'Comunicação Avançada',
    description: 'WhatsApp Business, mensagens segmentadas e agendadas, sincronização com Google Calendar.',
    minPlan: 'pro',
  },
  relatorios: {
    label: 'Relatórios',
    description: 'Relatórios de frequência, financeiros e de eventos com filtros por período, CSV e PDF.',
    minPlan: 'pro',
  },
  competicoes: {
    label: 'Competições',
    description: 'Registro de competições externas, inscrição de atletas por categoria e histórico de resultados.',
    minPlan: 'enterprise',
  },
  metodologia: {
    label: 'Metodologia',
    description: 'Biblioteca de exercícios, fichas de metodologia por modalidade e templates de planos de aula.',
    minPlan: 'enterprise',
  },
  cursos: {
    label: 'Cursos',
    description: 'Criação de cursos com vídeo e quiz, trilhas de aprendizado e certificados automáticos para equipe.',
    minPlan: 'pro',
  },
}

// ─── Reverse Route Map ────────────────────────────────────────────────────────
// Maps ModuloSlug → URL path segment (reverse of MODULO_ROUTES)
// 'administrativo' maps to 'administrativo' since it has no MODULO_ROUTES entry

export const MODULO_PATH: Record<ModuloSlug, string> = {
  administrativo: 'administrativo',
  ...Object.fromEntries(
    Object.entries(MODULO_ROUTES).map(([path, slug]) => [slug, path])
  ),
} as Record<ModuloSlug, string>
