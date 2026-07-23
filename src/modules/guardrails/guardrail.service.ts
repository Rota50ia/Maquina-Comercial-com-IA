const forbiddenPatterns = [
  /vai vender mais/i,
  /aumentar (seu|o) faturamento/i,
  /recuperar vendas/i,
  /melhorar (seu|o) roas/i,
  /garant(ir|e|ia).{0,30}resultado/i,
  /garantia de venda/i,
  /em \d+ dias você/i,
];

export function checkMessageGuardrail(message: string) {
  const blockedBy = forbiddenPatterns.find((pattern) => pattern.test(message));

  return {
    status: blockedBy ? "blocked" : "approved",
    reason: blockedBy ? `Padrão proibido: ${blockedBy.source}` : "Mensagem aprovada.",
  };
}

