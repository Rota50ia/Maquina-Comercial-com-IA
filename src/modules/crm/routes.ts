import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { checkMessageGuardrail } from "../guardrails/guardrail.service.js";
import { validateDashboardAuth } from "./auth.js";
import {
  applyLeadAction,
  getCrmReport,
  getLeadDetail,
  listLeads,
  sendLeadWhatsAppMessage,
  updateLeadContact,
} from "./crm.service.js";
import { renderCrmPage } from "./page.js";

const leadClassificationSchema = z.enum(["frio", "morno", "quente", "prioridade", "sem_fit"]);
const contactStatusSchema = z.enum(["active", "paused", "optout"]);

const leadListQuerySchema = z.object({
  classification: leadClassificationSchema.optional(),
  gargalo: z.string().trim().min(1).optional(),
  route: z.string().trim().min(1).optional(),
  status: contactStatusSchema.optional(),
  handoff: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  inProgress: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  resolved: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  followup: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
  limit: z.coerce.number().int().min(1).max(250).default(100),
});

const reportDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD.")
  .refine(isValidReportDate, "Informe uma data válida.");
const reportQuerySchema = z
  .object({
    days: z.coerce.number().int().min(1).max(90).optional(),
    dateFrom: reportDateSchema.optional(),
    dateTo: reportDateSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.dateFrom && !value.dateTo) || (!value.dateFrom && value.dateTo)) {
      ctx.addIssue({
        code: "custom",
        path: ["dateTo"],
        message: "Informe data inicial e data final.",
      });
    }

    if (value.dateFrom && value.dateTo && value.dateFrom > value.dateTo) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFrom"],
        message: "A data inicial deve ser menor ou igual à data final.",
      });
    }
  });

const messageGuardrailBodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

const sendWhatsAppBodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

function isValidReportDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const contactUpdateBodySchema = z
  .object({
    name: z.string().trim().max(160, "Nome deve ter no máximo 160 caracteres.").optional(),
    email: z.string().trim().max(254, "E-mail deve ter no máximo 254 caracteres.").optional(),
    phone: z.string().trim().max(32, "WhatsApp deve ter no máximo 32 caracteres.").optional(),
  })
  .superRefine((value, ctx) => {
    if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Informe um e-mail válido.",
      });
    }

    if (value.phone) {
      const digits = value.phone.replace(/\D/g, "");

      if (digits.length < 10 || digits.length > 15) {
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Informe um WhatsApp válido com DDI e DDD.",
        });
      }
    }
  });

const leadActionBodySchema = z
  .object({
    action: z.enum([
      "marcar_para_contato",
      "contato_realizado",
      "handoff_humano",
      "atendimento_iniciado",
      "resolver_handoff",
      "agendar_followup",
      "followup_realizado",
      "nota_rapida",
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

    if (value.action === "nota_rapida" && !value.note) {
      ctx.addIssue({
        code: "custom",
        path: ["note"],
        message: "Informe a nota rápida.",
      });
    }

    if (["mensagem_copiada", "mensagem_enviada"].includes(value.action) && !value.message) {
      ctx.addIssue({
        code: "custom",
        path: ["message"],
        message: "Informe a mensagem para validar o guardrail.",
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

  app.patch("/internal/leads/:contactId/contact", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const paramsResult = z.object({ contactId: z.string().min(1) }).safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_params",
      });
    }

    const bodyResult = contactUpdateBodySchema.safeParse(request.body);
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

    const result = await updateLeadContact(paramsResult.data.contactId, bodyResult.data);

    if (!result) {
      return reply.status(404).send({
        ok: false,
        error: "lead_not_found",
      });
    }

    if ("error" in result && !result.ok) {
      const errorCode = typeof result.error === "string" ? result.error : "unknown_error";
      const statusByError: Record<string, number> = {
        duplicate_contact: 409,
        invalid_phone: 400,
      };

      return reply.status(statusByError[errorCode] ?? 400).send(result);
    }

    return result;
  });

  app.get("/internal/reports/summary", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const queryResult = reportQuerySchema.safeParse(request.query);
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

    return getCrmReport(queryResult.data);
  });

  app.post("/internal/messages/guardrail-check", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const bodyResult = messageGuardrailBodySchema.safeParse(request.body);
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

    const guardrail = checkMessageGuardrail(bodyResult.data.message);

    return reply.status(guardrail.status === "blocked" ? 422 : 200).send({
      ok: guardrail.status === "approved",
      guardrail,
    });
  });

  app.post("/internal/leads/:contactId/messages/whatsapp", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const paramsResult = z.object({ contactId: z.string().min(1) }).safeParse(request.params);
    if (!paramsResult.success) {
      return reply.status(400).send({
        ok: false,
        error: "invalid_params",
      });
    }

    const bodyResult = sendWhatsAppBodySchema.safeParse(request.body);
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

    const result = await sendLeadWhatsAppMessage(paramsResult.data.contactId, bodyResult.data);

    if (!result) {
      return reply.status(404).send({
        ok: false,
        error: "lead_not_found",
      });
    }

    if (!result.ok) {
      const statusByError: Record<string, number> = {
        message_blocked: 422,
        missing_phone: 400,
        lead_optout: 409,
        uazapi_not_configured: 503,
        uazapi_request_failed: 502,
        whatsapp_send_failed: 502,
      };

      const errorCode = typeof result.error === "string" ? result.error : "unknown_error";

      return reply.status(statusByError[errorCode] ?? 400).send(result);
    }

    return result;
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

    if (detail && "error" in detail && detail.error === "message_blocked") {
      return reply.status(422).send(detail);
    }

    if (!detail) {
      return reply.status(404).send({
        ok: false,
        error: "lead_not_found",
      });
    }

    return detail;
  });
}
