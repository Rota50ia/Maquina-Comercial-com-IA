import type { ContactStatus, LeadClassification, Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";

export type LeadListFilters = {
  classification?: LeadClassification;
  gargalo?: string;
  route?: string;
  status?: ContactStatus;
  handoff?: boolean;
  limit?: number;
};

export type LeadActionInput = {
  action:
    | "marcar_para_contato"
    | "contato_realizado"
    | "handoff_humano"
    | "resolver_handoff"
    | "pausar"
    | "reativar"
    | "optout";
  note?: string;
};

type LeadSummaryItem = {
  latestScore: {
    classification: string;
  } | null;
  latestQuizSubmission: {
    gargalo: string;
  } | null;
  latestRoute: {
    route: string;
  } | null;
};

const HUMAN_HANDOFF_ROUTE = "rota:chamar-humano";
const RESOLVED_HANDOFF_ROUTE = "rota:handoff-resolvido";

export async function listLeads(filters: LeadListFilters) {
  const where: Prisma.ContactWhereInput = {
    deletedAt: null,
  };

  if (filters.classification) {
    where.leadScores = {
      some: {
        classification: filters.classification,
      },
    };
  }

  if (filters.gargalo) {
    where.quizSubmissions = {
      some: {
        gargalo: filters.gargalo,
      },
    };
  }

  if (filters.route) {
    where.routeDecisions = {
      some: {
        route: filters.route,
      },
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: filters.handoff ? 250 : (filters.limit ?? 100),
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      preferredChannel: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      quizSubmissions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          source: true,
          gargalo: true,
          resultTitle: true,
          secondCategory: true,
          submittedAt: true,
        },
      },
      leadScores: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          score: true,
          classification: true,
          reasonsJson: true,
          calculatedAt: true,
        },
      },
      routeDecisions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          route: true,
          reason: true,
          createdAt: true,
        },
      },
      eventLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          eventType: true,
          createdAt: true,
        },
      },
      contactTags: {
        select: {
          tag: {
            select: {
              key: true,
              label: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const leads = contacts.map((contact) => ({
    ...contact,
    latestQuizSubmission: contact.quizSubmissions[0] ?? null,
    latestScore: contact.leadScores[0] ?? null,
    latestRoute: contact.routeDecisions[0] ?? null,
    latestEvent: contact.eventLogs[0] ?? null,
    tags: contact.contactTags.map((contactTag) => contactTag.tag),
    quizSubmissions: undefined,
    leadScores: undefined,
    routeDecisions: undefined,
    eventLogs: undefined,
    contactTags: undefined,
  }));
  const visibleLeads = filters.handoff ? leads.filter(isLeadInHandoffQueue) : leads;

  return {
    ok: true,
    total: visibleLeads.length,
    summary: summarizeLeads(visibleLeads),
    leads: visibleLeads.slice(0, filters.limit ?? 100),
  };
}

export async function getLeadDetail(contactId: string) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      instagramHandle: true,
      preferredChannel: true,
      status: true,
      consentSource: true,
      createdAt: true,
      updatedAt: true,
      quizSubmissions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      leadScores: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      routeDecisions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      eventLogs: {
        orderBy: { createdAt: "desc" },
        take: 30,
      },
      contactTags: {
        orderBy: { createdAt: "desc" },
        select: {
          createdAt: true,
          source: true,
          tag: {
            select: {
              key: true,
              label: true,
            },
          },
        },
      },
    },
  });

  if (!contact) return null;

  return {
    ok: true,
    lead: {
      ...contact,
      tags: contact.contactTags.map((contactTag) => ({
        ...contactTag.tag,
        source: contactTag.source,
        createdAt: contactTag.createdAt,
      })),
      contactTags: undefined,
    },
  };
}

export async function applyLeadAction(contactId: string, input: LeadActionInput) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: { id: true },
  });

  if (!contact) return null;

  await prisma.$transaction(async (tx) => {
    const status = getStatusForAction(input.action);

    await tx.contact.update({
      where: { id: contactId },
      data: status
        ? {
            status,
            optOutAt: status === "optout" ? new Date() : null,
          }
        : {
            updatedAt: new Date(),
          },
    });

    if (input.action === "handoff_humano") {
      await tx.routeDecision.create({
        data: {
          contactId,
          route: HUMAN_HANDOFF_ROUTE,
          reason: input.note || "handoff humano acionado manualmente no CRM",
        },
      });
    }

    if (input.action === "resolver_handoff") {
      await tx.routeDecision.create({
        data: {
          contactId,
          route: RESOLVED_HANDOFF_ROUTE,
          reason: input.note || "handoff humano resolvido no CRM",
        },
      });
    }

    await tx.eventLog.create({
      data: {
        contactId,
        eventType: getEventTypeForAction(input.action),
        payload: compactJson({
          action: input.action,
          note: input.note,
          source: "crm",
        }) as Prisma.InputJsonValue,
      },
    });
  });

  return getLeadDetail(contactId);
}

function getStatusForAction(action: LeadActionInput["action"]) {
  const statusByAction: Partial<Record<LeadActionInput["action"], ContactStatus>> = {
    pausar: "paused",
    reativar: "active",
    optout: "optout",
  };

  return statusByAction[action];
}

function getEventTypeForAction(action: LeadActionInput["action"]) {
  const eventTypeByAction: Record<LeadActionInput["action"], string> = {
    marcar_para_contato: "crm_marcar_para_contato",
    contato_realizado: "crm_contato_realizado",
    handoff_humano: "crm_handoff_humano",
    resolver_handoff: "crm_handoff_resolvido",
    pausar: "crm_lead_pausado",
    reativar: "crm_lead_reativado",
    optout: "crm_lead_optout",
  };

  return eventTypeByAction[action];
}

function isLeadInHandoffQueue(lead: LeadSummaryItem) {
  if (lead.latestRoute?.route === RESOLVED_HANDOFF_ROUTE) return false;

  return lead.latestRoute?.route === HUMAN_HANDOFF_ROUTE || lead.latestScore?.classification === "prioridade";
}

function summarizeLeads(leads: LeadSummaryItem[]) {
  const byClassification: Record<string, number> = {};
  const byGargalo: Record<string, number> = {};
  const byRoute: Record<string, number> = {};

  for (const lead of leads) {
    const classification = lead.latestScore?.classification ?? "sem_score";
    const gargalo = lead.latestQuizSubmission?.gargalo ?? "sem_gargalo";
    const route = lead.latestRoute?.route ?? "sem_rota";

    byClassification[classification] = (byClassification[classification] ?? 0) + 1;
    byGargalo[gargalo] = (byGargalo[gargalo] ?? 0) + 1;
    byRoute[route] = (byRoute[route] ?? 0) + 1;
  }

  return {
    byClassification,
    byGargalo,
    byRoute,
  };
}

function compactJson(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
