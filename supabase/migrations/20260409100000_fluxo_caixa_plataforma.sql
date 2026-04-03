-- Migration: fluxo_caixa_plataforma
-- Gestão financeira interna da plataforma Esportes Academy.
-- Contempla receitas (mensalidades, % vendas, setup, upgrade, módulos avulsos)
-- e despesas (infra, payroll, marketing, impostos, ferramentas, serviços externos).
-- Suporta pagamentos via Asaas, cartão de crédito e manual.

CREATE TABLE fluxo_caixa_plataforma (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classificação
  tipo            text          NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria       text          NOT NULL CHECK (categoria IN (
    -- Receitas
    'mensalidade_escola',   -- assinatura mensal da escola
    'percentual_vendas',    -- % sobre vendas (cursos, matrículas, etc.)
    'setup_fee',            -- taxa de implantação
    'upgrade_plano',        -- upgrade de plano
    'modulo_avulso',        -- módulo contratado avulso
    'outro_receita',
    -- Despesas
    'payroll',              -- folha de pagamento / freelancers
    'infra_cloud',          -- servidores, Supabase, Vercel, etc.
    'marketing',            -- anúncios, materiais
    'impostos_taxas',       -- impostos, taxas bancárias, tarifas gateway
    'ferramentas_saas',     -- softwares, subscrições de ferramentas
    'servicos_externos',    -- contadores, jurídico, consultorias
    'outro_despesa'
  )),

  -- Conteúdo
  descricao       text          NOT NULL,
  observacao      text,

  -- Origem (opcional — para receitas vinculadas a uma escola)
  escola_id       uuid          REFERENCES escolas(id) ON DELETE SET NULL,
  escola_nome_cache text,       -- snapshot do nome da escola no momento do registro

  -- Valor e data
  valor           numeric(12,2) NOT NULL CHECK (valor > 0),
  data_lancamento date          NOT NULL DEFAULT CURRENT_DATE,

  -- Status
  status          text          NOT NULL DEFAULT 'previsto'
    CHECK (status IN ('previsto', 'realizado', 'cancelado')),

  -- Forma de pagamento / recebimento
  forma_pagamento text          NOT NULL DEFAULT 'manual'
    CHECK (forma_pagamento IN ('asaas', 'cartao_credito', 'pix', 'boleto', 'manual', 'debito')),

  -- Recorrência
  recorrencia     text          NOT NULL DEFAULT 'unico'
    CHECK (recorrencia IN ('unico', 'mensal', 'trimestral', 'anual')),
  recorrencia_grupo_id uuid,    -- agrupa parcelas de um mesmo contrato recorrente

  -- Asaas integration (opcional)
  asaas_payment_id text,

  -- Percentual de vendas (para categoria percentual_vendas)
  percentual      numeric(5,2), -- ex: 10.00 = 10%
  base_calculo    numeric(12,2),-- valor sobre o qual o percentual foi calculado

  -- Auditoria
  ator_id         uuid,         -- super_admin que registrou
  ator_email      text,
  deleted_at      timestamptz,
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);

-- Trigger updated_at
CREATE TRIGGER handle_updated_at_fluxo_caixa
  BEFORE UPDATE ON fluxo_caixa_plataforma
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices
CREATE INDEX fluxo_caixa_tipo_idx
  ON fluxo_caixa_plataforma (tipo)
  WHERE deleted_at IS NULL;

CREATE INDEX fluxo_caixa_data_idx
  ON fluxo_caixa_plataforma (data_lancamento DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX fluxo_caixa_escola_idx
  ON fluxo_caixa_plataforma (escola_id)
  WHERE deleted_at IS NULL AND escola_id IS NOT NULL;

CREATE INDEX fluxo_caixa_status_idx
  ON fluxo_caixa_plataforma (status)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX fluxo_caixa_asaas_payment_uk
  ON fluxo_caixa_plataforma (asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL AND deleted_at IS NULL;

-- RLS
ALTER TABLE fluxo_caixa_plataforma ENABLE ROW LEVEL SECURITY;

-- Apenas super_admins (service role) acessam via admin client — sem RLS por perfil de escola.
-- O acesso é feito exclusivamente pelo admin client (service role bypass RLS).
-- Política permissiva para o service role:
CREATE POLICY "service_role_fluxo_caixa"
  ON fluxo_caixa_plataforma
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Usuários autenticados da plataforma podem apenas ler (via anon não é necessário)
CREATE POLICY "plataforma_usuarios_read_fluxo_caixa"
  ON fluxo_caixa_plataforma
  FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM plataforma_usuarios
      WHERE user_id = auth.uid()
        AND ativo = true
        AND deleted_at IS NULL
    )
  );
