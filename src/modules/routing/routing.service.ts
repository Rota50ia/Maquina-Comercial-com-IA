import type { LeadClassification } from "@prisma/client";
import type { QuizWebhookInput } from "../quiz/schemas.js";

export type RouteDecisionResult = {
  route: string;
  reason: string;
  handoffRequired: boolean;
};

export function decideQuizRoute(
  payload: QuizWebhookInput,
  classification: LeadClassification,
): RouteDecisionResult {
  if (classification === "prioridade") {
    return {
      route: "rota:chamar-humano",
      reason: "lead classificado como prioridade",
      handoffRequired: true,
    };
  }

  if (["oferta", "checkout", "followup", "promessa", "criativo", "vsl", "pagina"].includes(payload.gargalo)) {
    return {
      route: "rota:nutrir-campanhas-2026",
      reason: `gargalo ${payload.gargalo} conectado ao produto Campanhas 2026`,
      handoffRequired: false,
    };
  }

  if (payload.gargalo === "politica") {
    return {
      route: "rota:entregar-mapa-do-gargalo",
      reason: "gargalo de qualidade percebida exige linguagem prudente",
      handoffRequired: false,
    };
  }

  return {
    route: "rota:nutricao-leve",
    reason: "lead precisa de diagnóstico antes de oferta avançada",
    handoffRequired: false,
  };
}

