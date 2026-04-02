export function getEventoNotificacaoLabel(eventoTipo: string): string {
  const labels: Record<string, string> = {
    cobranca_vencendo_d3: 'Cobranca vencendo em 3 dias',
    cobranca_vencendo_d1: 'Cobranca vencendo amanha',
    cobranca_vencida: 'Cobranca vencida',
    cobranca_confirmada: 'Cobranca confirmada',
    ausencia: 'Ausencia registrada',
    frequencia_baixa: 'Frequencia baixa',
    comunicado: 'Comunicado',
    check_in: 'Check-in do atleta',
    check_out: 'Check-out do atleta',
    aniversario_atleta: 'Parabens de aniversario',
  }

  return labels[eventoTipo] ?? eventoTipo
}
