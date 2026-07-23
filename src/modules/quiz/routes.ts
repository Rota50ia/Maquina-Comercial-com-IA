import type { FastifyInstance, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { env } from "../../shared/config/env.js";
import { processQuizSubmission } from "./quiz.service.js";
import { quizWebhookSchema } from "./schemas.js";

export async function registerQuizRoutes(app: FastifyInstance) {
  app.post("/webhooks/quiz-raio-x", async (request, reply) => {
    validateWebhookSecret(request);

    try {
      const payload = quizWebhookSchema.parse(request.body);
      const result = await processQuizSubmission(payload);

      return reply.status(201).send({
        ok: true,
        contact_id: result.contact.id,
        score: result.score.score,
        classification: result.score.classification,
        route: result.route.route,
        handoff_required: result.route.handoffRequired,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          ok: false,
          error: "invalid_payload",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      throw error;
    }
  });
}

function validateWebhookSecret(request: FastifyRequest) {
  if (!env.WEBHOOK_SECRET) return;

  const headerSecret = request.headers["x-maquina-webhook-token"];

  if (headerSecret !== env.WEBHOOK_SECRET) {
    const error = new Error("Webhook não autorizado.");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }
}

