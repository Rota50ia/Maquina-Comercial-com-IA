type GuardrailRule = {
  id: string;
  label: string;
  pattern: RegExp;
};

const forbiddenRules: GuardrailRule[] = [
  {
    id: "promise_more_sales",
    label: "Promessa direta de vender mais",
    pattern: /\b(vai|vamos|consigo|posso)\s+(te\s+|voc[eê]\s+)?(fazer\s+)?(voc[eê]\s+|te\s+)?vender\s+mais\b/i,
  },
  {
    id: "promise_revenue",
    label: "Promessa direta de faturamento",
    pattern: /\b(aumentar|multiplicar|dobrar|triplicar|escalar)\s+(seu|o|teu)?\s*(faturamento|lucro|receita)\b/i,
  },
  {
    id: "recover_sales",
    label: "Promessa de recuperar vendas",
    pattern: /\b(recuperar|trazer de volta)\s+(suas\s+)?vendas\b/i,
  },
  {
    id: "roas_claim",
    label: "Promessa de melhora de ROAS",
    pattern: /\b(melhorar|aumentar|dobrar|triplicar|garantir)\s+(seu|o)?\s*roas\b/i,
  },
  {
    id: "guaranteed_result",
    label: "Garantia de resultado",
    pattern: /\b(garantir|garante|garanto|garantimos|garantia|garantido|garantida)\b.{0,50}\b(resultado|venda|faturamento|lucro|receita|convers[aã]o|roas)\b/i,
  },
  {
    id: "time_bound_result",
    label: "Resultado prometido em prazo específico",
    pattern: /\b(em|dentro de)\s+\d+\s+(dias|semanas|meses)\b.{0,70}\b(vender|faturar|lucrar|resultado|venda|roas|convers[aã]o)\b/i,
  },
];

export function checkMessageGuardrail(message: string) {
  const matches = forbiddenRules
    .filter((rule) => rule.pattern.test(message))
    .map((rule) => ({
      id: rule.id,
      label: rule.label,
    }));

  return {
    status: matches.length ? "blocked" : "approved",
    reason: matches.length ? matches.map((match) => match.label).join("; ") : "Mensagem aprovada pelo guardrail.",
    matches,
  };
}
