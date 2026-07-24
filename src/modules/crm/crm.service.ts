import type { LeadClassification, Prisma } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";

export type LeadListFilters = {
  classification?: LeadClassification;
  gargalo?: string;
  route?: string;
  limit?: number;
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

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: filters.limit ?? 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      preferredChannel: true,
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

  return {
    ok: true,
    total: leads.length,
    summary: summarizeLeads(leads),
    leads,
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
