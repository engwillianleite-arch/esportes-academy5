# ADR-002 — Matriz de permissões perfil × módulo DB-driven

**Status:** Accepted  
**Data:** 2026-04-08  
**Stories:** 8.1, 8.4

---

## Contexto

A versão original do sistema usava uma matriz estática em `src/lib/modulo-access.ts` (`PERMISSION_MATRIX`) para decidir quais perfis de usuário podiam acessar quais módulos. Qualquer ajuste exigia um deploy de código.

O produto precisava que o SuperAdmin pudesse ajustar essas regras em tempo real — sem deploy — para atender contratos específicos e experimentos.

---

## Decisão

Criar uma tabela `perfil_modulo_acesso` no banco (Postgres/Supabase) com uma linha por par `(modulo_slug, perfil)` e o campo `ativo boolean`. O middleware verifica esta tabela **antes** de cair na matriz estática.

### Regra de acesso (middleware)

```
1. Consultar perfil_modulo_acesso WHERE modulo_slug = X AND perfil = Y
2. Se linha encontrada → usar seu valor `ativo`
3. Se linha NÃO encontrada → usar PERMISSION_MATRIX[X].includes(Y) como fallback
```

### Escolhas de design

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Escopo da matriz | **Global** (não por escola) | Simplifica o modelo; escolas não precisam de matrizes diferentes |
| Cache | **Sem cache** (consulta por request) | Edge runtime do Next.js não persiste estado; simplicidade > performance aqui |
| Fallback | `PERMISSION_MATRIX` estático | Garante que o sistema continue funcionando se a tabela estiver vazia |
| RLS | SELECT público, INSERT/UPDATE somente service role | A matriz não é sensível; escrita controlada pelo SuperAdmin |
| Seed | 77 linhas (11 módulos × 7 perfis) espelhando o estado atual | Paridade total com o comportamento anterior ao deploy |

---

## Consequências

**Positivas:**
- SuperAdmin pode ajustar permissões sem deploy via `/superadmin/permissoes`
- Alteração reflete na próxima request do usuário (sem reinicialização)
- Fallback estático garante zero downtime se tabela estiver vazia

**Negativas:**
- Cada request de rota de módulo faz uma query extra ao banco (mas já havia a query `is_module_active`, então o custo marginal é baixo)
- Manter o seed sincronizado com qualquer futura mudança na `PERMISSION_MATRIX` é responsabilidade manual

---

## Alternativas consideradas

- **Cache Redis/edge**: rejeitado por complexidade de invalidação
- **Matriz por escola**: rejeitado por over-engineering para o MVP
- **Remover matriz estática**: rejeitado por risco operacional (fallback necessário)
