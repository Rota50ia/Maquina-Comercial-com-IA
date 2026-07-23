import type { LeadClassification } from "@prisma/client";
import type { QuizWebhookInput } from "../quiz/schemas.js";

type ScoreResult = {
  score: number;
  classification: LeadClassification;
  reasons: string[];
};

export function calculateQuizLeadScore(payload: QuizWebhookInput): ScoreResult {
  let score = 0;
  const reasons: string[] = [];

  if (payload.nome && payload.email && payload.whatsapp) {
    score += 20;
    reasons.push("preencheu nome, e-mail e WhatsApp");
  }

  if (payload.gargalo) {
    score += 20;
    reasons.push(`gargalo identificado: ${payload.gargalo}`);
  }

  const winnerScore = payload.scores?.[payload.gargalo] ?? 0;
  if (winnerScore >= 3) {
    score += 15;
    reasons.push("gargalo vencedor com 3 pontos ou mais");
  }

  if (payload.segunda_categoria) {
    score += 10;
    reasons.push(`segunda categoria relevante: ${payload.segunda_categoria}`);
  }

  if (["oferta", "checkout", "followup"].includes(payload.gargalo)) {
    score += 15;
    reasons.push("gargalo comercial próximo da decisão");
  }

  if (payload.gargalo === "politica") {
    score += 10;
    reasons.push("risco de qualidade percebida ou promessa sensível");
  }

  if (payload.gargalo === "diagnostico") {
    score += 5;
    reasons.push("precisa organizar diagnóstico antes da oferta");
  }

  const boundedScore = Math.min(score, 100);

  return {
    score: boundedScore,
    classification: classifyScore(boundedScore),
    reasons,
  };
}

function classifyScore(score: number): LeadClassification {
  if (score >= 80) return "prioridade";
  if (score >= 65) return "quente";
  if (score >= 40) return "morno";
  return "frio";
}

