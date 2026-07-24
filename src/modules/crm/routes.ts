import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { validateDashboardAuth } from "./auth.js";
import { getLeadDetail, listLeads } from "./crm.service.js";
import { renderCrmPage } from "./page.js";

const leadClassificationSchema = z.enum(["frio", "morno", "quente", "prioridade", "sem_fit"]);

const leadListQuerySchema = z.object({
  classification: leadClassificationSchema.optional(),
  gargalo: z.string().trim().min(1).optional(),
  route: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(250).default(100),
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

    const query = leadListQuerySchema.parse(request.query);

    return listLeads(query);
  });

  app.get("/internal/leads/:contactId", async (request, reply) => {
    const authReply = validateDashboardAuth(request, reply);
    if (authReply) return authReply;

    const params = z.object({ contactId: z.string().min(1) }).parse(request.params);
    const detail = await getLeadDetail(params.contactId);

    if (!detail) {
      return reply.status(404).send({
        ok: false,
        error: "lead_not_found",
      });
    }

    return detail;
  });
}
