import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { validateDashboardAuth } from "./auth.js";
import { applyLeadAction, getLeadDetail, listLeads } from "./crm.service.js";
import { renderCrmPage } from "./page.js";

const leadClassificationSchema = z.enum(["frio", "morno", "quente", "prioridade", "sem_fit"]);
const contactStatusSchema = z.enum(["active", "paused", "optout"]);

const leadListQuerySchema = z.object({
  classification: leadClassificationSchema.optional(),
  gargalo: z.string().trim().min(1).optional(),
  route: z.string().trim().min(1).optional(),
  status: contactStatusSchema.optional(),
  handoff: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  followup: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  limit: z.coerce.number().int().min(1).max(250).default(100),
});

const leadActionBodySchema = z
  .object({
    action: z.enum([
      "marcar_para_contato",
      "contato_realizado",
      "handoff_humano",
      "resolver_handoff",
      "agendar_followup",
      "followup_realizado",
      "mensagem_copiada",
      "mensagem_enviada",
      "pausar",
      "reativar",
      "optout",
    ]),
    note: z.string().trim().max(500).optional(),
    dueAt: z.string().trim().max(80).optional(),
    message: z.string().trim().max(2000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "agendar_followup" && !value.dueAt) {
      ctx.addIssue({
        code: "custom",
        path: ["dueAt"],
        message: "Informe data e hora do follow-up.",
      });
    }
  });

export async function registerCrmRoutes(app: FastifyInstance) {
  app.get("/crm", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    return reply.type("text/html; charset=utf-8").send(renderCrmPage());
  });

  app.get("/internal/leads", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const queryResult = leadListQuerySchema.safeParse(request.query);
    if (!queryResult.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_query",
        issues: queryResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    return listLeads(queryResult.data);
  });

  app.get("/internal/leads/:contactId", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const paramsResult = z.object({ contactId: z.string().min(1) }).safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_params",
      });
    }

    const params = paramsResult.data;
    const detail = await getLeadDetail(params.contactId);

    if (!detail) {
      return reply.status(404).send({
        ok: false,
        error: "lead_not_found",
      });
    }

    return detail;
  });

  app.post("/internal/leads/:contactId/actions", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const paramsResult = z.object({ contactId: z.string().min(1) }).safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_params",
      });
    }

    const bodyResult = leadActionBodySchema.safeParse(request.body);
    if (!bodyResult.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_payload",
        issues: bodyResult.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const params = paramsResult.data;
    const body = bodyResult.data;
    const detail = await applyLeadAction(params.contactId, body);

    if (!detail) {
      return reply.status(404).send({
        ok: false,
        error: "lead_not_found",
      });
    }

    return detail;
  });
}
