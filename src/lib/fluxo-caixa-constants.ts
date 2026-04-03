// ─── Types ────────────────────────────────────────────────────────────────────

export type FluxoCaixaTipo       = 'receita' | 'despesa'
export type FluxoCaixaCategoria  =
  | 'mensalidade_escola' | 'percentual_vendas' | 'setup_fee'
  | 'upgrade_plano' | 'modulo_avulso' | 'outro_receita'
  | 'payroll' | 'infra_cloud' | 'marketing' | 'impostos_taxas'
  | 'ferramentas_saas' | 'servicos_externos' | 'outro_despesa'
export type FluxoCaixaStatus     = 'previsto' | 'realizado' | 'cancelado'
export type FluxoCaixaRecorrencia= 'unico' | 'mensal' | 'trimestral' | 'anual'
export type FormaPagamento       = 'asaas' | 'cartao_credito' | 'pix' | 'boleto' | 'manual' | 'debito'

export type LancamentoRow = {
  id:                  string
  tipo:                FluxoCaixaTipo
  categoria:           FluxoCaixaCategoria
  descricao:           string
  observacao:          string | null
  escola_id:           string | null
  escola_nome_cache:   string | null
  valor:               number
  data_lancamento:     string
  status:              FluxoCaixaStatus
  forma_pagamento:     FormaPagamento
  recorrencia:         FluxoCaixaRecorrencia
  percentual:          number | null
  base_calculo:        number | null
  ator_email:          string | null
  created_at:          string
}

export type KpiFluxo = {
  saldo_atual:      number
  entradas_mes:     number
  saidas_mes:       number
  saldo_projetado:  number
  mrr:              number
}

export type MonthlyAggregate = {
  mes: string
  receitas: number
  despesas: number
}

export type CategoriaAggregate = {
  categoria: FluxoCaixaCategoria
  valor: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIAS_RECEITA: { value: FluxoCaixaCategoria; label: string }[] = [
  { value: 'mensalidade_escola', label: 'Mensalidade de Escola'  },
  { value: 'percentual_vendas',  label: '% sobre Vendas'         },
  { value: 'setup_fee',          label: 'Setup Fee'              },
  { value: 'upgrade_plano',      label: 'Upgrade de Plano'       },
  { value: 'modulo_avulso',      label: 'Módulo Avulso'          },
  { value: 'outro_receita',      label: 'Outro'                  },
]

export const CATEGORIAS_DESPESA: { value: FluxoCaixaCategoria; label: string }[] = [
  { value: 'payroll',            label: 'Payroll / Equipe'       },
  { value: 'infra_cloud',        label: 'Infraestrutura Cloud'   },
  { value: 'marketing',          label: 'Marketing'              },
  { value: 'impostos_taxas',     label: 'Impostos & Taxas'       },
  { value: 'ferramentas_saas',   label: 'Ferramentas SaaS'       },
  { value: 'servicos_externos',  label: 'Serviços Externos'      },
  { value: 'outro_despesa',      label: 'Outro'                  },
]

export const CATEGORIA_LABEL: Record<FluxoCaixaCategoria, string> = {
  mensalidade_escola: 'Mensalidade',
  percentual_vendas:  '% Vendas',
  setup_fee:          'Setup Fee',
  upgrade_plano:      'Upgrade Plano',
  modulo_avulso:      'Módulo Avulso',
  outro_receita:      'Outro',
  payroll:            'Payroll',
  infra_cloud:        'Infra Cloud',
  marketing:          'Marketing',
  impostos_taxas:     'Impostos',
  ferramentas_saas:   'Ferramentas SaaS',
  servicos_externos:  'Serviços Ext.',
  outro_despesa:      'Outro',
}

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  asaas:          'Asaas',
  cartao_credito: 'Cartão de Crédito',
  pix:            'Pix',
  boleto:         'Boleto',
  manual:         'Manual',
  debito:         'Débito',
}
