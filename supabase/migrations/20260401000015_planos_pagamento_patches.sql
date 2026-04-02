-- Migration: planos_pagamento patches — Story 3.1 code review
-- Adds CHECK constraints for frequencia/metodo_pagamento and a partial index for performance

-- P2: Enum-like CHECK constraints for text enum columns
ALTER TABLE planos_pagamento
  ADD CONSTRAINT planos_pagamento_frequencia_check
    CHECK (frequencia IN ('mensal', 'trimestral', 'semestral', 'anual'));

ALTER TABLE planos_pagamento
  ADD CONSTRAINT planos_pagamento_metodo_pagamento_check
    CHECK (metodo_pagamento IN ('boleto', 'pix', 'cartao_credito'));

-- P5: Partial index for the most common query pattern (list + RLS subquery)
CREATE INDEX planos_pagamento_escola_ativo_idx
  ON planos_pagamento (escola_id)
  WHERE deleted_at IS NULL;
