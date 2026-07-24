import { prisma } from "../../shared/db/prisma.js";
import { findOrCreateContact } from "../contacts/contact.service.js";
import { decideQuizRoute } from "../routing/routing.service.js";
import { calculateQuizLeadScore } from "../scoring/scoring.service.js";
import { applyTags, getQuizTags } from "../tagging/tagging.service.js";
import type { QuizWebhookInput } from "./schemas.js";

export async function processQuizSubmission(payload: QuizWebhookInput) {
  const source = payload.source ?? payload.origem;
  const pageUrl = payload.page_url ?? payload.page;

  const contact = await findOrCreateContact({
    name: payload.nome,
    email: payload.email,
    phone: payload.whatsapp,
    instagramHandle: payload.instagram,
    preferredChannel: payload.whatsapp ? "whatsapp" : payload.email ? "email" : "instagram",
    consentSource: source,
  });

  const score = calculateQuizLeadScore(payload);
  const route = decideQuizRoute(payload, score.classification);
  const tags = [...getQuizTags(payload.gargalo), route.route];

  const utm = payload.utm ?? {
    source: payload.utm_source,
    medium: payload.utm_medium,
    campaign: payload.utm_campaign,
    content: payload.utm_content,
    term: payload.utm_term,
  };

  await prisma.$transaction(async (tx) => {
    await tx.quizSubmission.create({
      data: {
        contactId: contact.id,
        source,
        pageUrl,
        gargalo: payload.gargalo,
        resultTitle: payload.resultado,
        secondCategory: payload.segunda_categoria,
        scoresJson: payload.scores,
        answersJson: payload.respostas,
        actionsJson: payload.acoes_recomendadas,
        ctaResult: payload.cta_resultado,
        utmJson: utm,
        submittedAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
      },
    });

    await tx.leadScore.create({
      data: {
        contactId: contact.id,
        score: score.score,
        classification: score.classification,
        reasonsJson: score.reasons,
      },
    });

    await tx.routeDecision.create({
      data: {
        contactId: contact.id,
        route: route.route,
        reason: route.reason,
      },
    });

    await tx.eventLog.create({
      data: {
        contactId: contact.id,
        eventType: "raio_x_lead_capturado",
        payload: {
          origem: payload.origem,
          source,
          gargalo: payload.gargalo,
          route: route.route,
          score: score.score,
          classification: score.classification,
        },
      },
    });
  });

  await applyTags(contact.id, tags, "quiz-raio-x");

  return {
    contact,
    score,
    route,
  };
}
