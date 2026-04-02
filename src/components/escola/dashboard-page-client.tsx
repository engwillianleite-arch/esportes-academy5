'use client'

import {
  Users,
  LayoutGrid,
  CalendarCheck,
  DollarSign,
  AlertCircle,
  Cake,
} from 'lucide-react'
import type {
  DashboardKpis,
  AulaHojeStatus,
  AniversarianteMes,
} from '@/lib/dashboard-actions'

type Props = {
  kpis: DashboardKpis
  aulasHoje: AulaHojeStatus[]
  aniversariantesMes: AniversarianteMes[]
  showAthletes: boolean
  showGroups: boolean
  showFinanceiro: boolean
  showAttendance: boolean
}

type KpiCardProps = {
  icon: React.ReactNode
  value: string | number
  label: string
  sub?: string
}

function KpiCard({ icon, value, label, sub }: KpiCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border bg-card p-4 ring-1 ring-foreground/10">
      <div className="shrink-0 rounded-md bg-[#20c997]/10 p-2">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPageClient({
  kpis,
  aulasHoje,
  aniversariantesMes,
  showAthletes,
  showGroups,
  showFinanceiro,
  showAttendance,
}: Props) {
  const iconCls = 'size-5 text-[#20c997]'
  const now = new Date()
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(now)
  const monthNumber = String(now.getMonth() + 1).padStart(2, '0')

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visao geral da escola</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {showAthletes && (
          <KpiCard
            icon={<Users className={iconCls} />}
            value={kpis.atletasAtivos}
            label="Atletas ativos"
          />
        )}

        {showGroups && (
          <KpiCard
            icon={<LayoutGrid className={iconCls} />}
            value={kpis.turmasAtivas}
            label="Turmas ativas"
          />
        )}

        {showAttendance && (
          <KpiCard
            icon={<CalendarCheck className={iconCls} />}
            value={kpis.aulasHoje}
            label="Aulas hoje"
            sub={kpis.aulasHoje > 0 ? `${kpis.aulasComChamada} com chamada` : undefined}
          />
        )}

        {showFinanceiro && (
          <>
            <KpiCard
              icon={<DollarSign className={iconCls} />}
              value="-"
              label="Receita mensal"
              sub="Disponivel apos Epic 5"
            />
            <KpiCard
              icon={<AlertCircle className={iconCls} />}
              value="-"
              label="Inadimplencia"
              sub="Disponivel apos Epic 5"
            />
          </>
        )}
      </div>

      {showAttendance && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Aulas de hoje</h2>

          {aulasHoje.length === 0 ? (
            <p className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              Nenhuma aula programada para hoje.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-xl border bg-card ring-1 ring-foreground/10">
              {aulasHoje.map((aula) => (
                <div
                  key={aula.turmaId}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{aula.turmaNome}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {aula.registrosPresenca}/{aula.matriculasAtivas} registros
                    </p>
                  </div>

                  {aula.chamadaFeita ? (
                    <span className="shrink-0 rounded-full bg-green-500/15 px-3 py-0.5 text-xs font-medium text-green-700 dark:text-green-300">
                      Chamada feita
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300">
                      Chamada pendente
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Cake className="size-4 text-[#20c997]" />
          <h2 className="text-base font-semibold">Aniversariantes de {monthLabel}</h2>
        </div>

        {aniversariantesMes.length === 0 ? (
          <p className="rounded-xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
            Nenhum aniversariante neste mes.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-xl border bg-card ring-1 ring-foreground/10">
            {aniversariantesMes.map((atleta) => (
              <div
                key={atleta.atletaId}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{atleta.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {atleta.turmaNome ?? 'Sem turma'} • {String(atleta.diaAniversario).padStart(2, '0')}/{monthNumber}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-[#20c997]/10 px-3 py-0.5 text-xs font-medium text-[#0f8f6c]">
                  Dia {String(atleta.diaAniversario).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showFinanceiro && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Receita - ultimos 12 meses</h2>
          <div className="rounded-xl border bg-card px-4 py-10 text-center ring-1 ring-foreground/10">
            <DollarSign className="mx-auto mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Grafico de receita disponivel apos configuracao financeira (Epic 5)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
