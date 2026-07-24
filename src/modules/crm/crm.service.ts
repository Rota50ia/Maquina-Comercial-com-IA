import { Prisma, type ContactStatus, type LeadClassification } from "@prisma/client";
import {
  sendUazapiTextMessage,
  UazapiConfigurationError,
  UazapiRequestError,
} from "../channels/uazapi.service.js";
import { checkMessageGuardrail } from "../guardrails/guardrail.service.js";
import { prisma } from "../../shared/db/prisma.js";

export type LeadListFilters = {
  classification?: LeadClassification;
  gargalo?: string;
  route?: string;
  status?: ContactStatus;
  handoff?: boolean;
  inProgress?: boolean;
  resolved?: boolean;
  followup?: boolean;
  limit?: number;
};

export type LeadActionInput = {
  action:
    | "marcar_para_contato"
    | "contato_realizado"
    | "handoff_humano"
    | "atendimento_iniciado"
    | "resolver_handoff"
    | "agendar_followup"
    | "followup_realizado"
    | "nota_rapida"
    | "mensagem_copiada"
    | "mensagem_enviada"
    | "pausar"
    | "reativar"
    | "optout";
  note?: string;
  dueAt?: string;
  message?: string;
};

export type CrmReportFilters = {
  days?: number;
  dateFrom?: string;
  dateTo?: string;
};

export type SendWhatsAppMessageInput = {
  message: string;
};

export type UpdateLeadContactInput = {
  name?: string;
  email?: string;
  phone?: string;
};

type LeadSummaryItem = {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  updatedAt?: Date;
  latestScore: {
    score?: number;
    classification: string;
  } | null;
  latestQuizSubmission: {
    gargalo: string;
  } | null;
  latestRoute: {
    route: string;
    reason?: string;
    createdAt?: Date;
  } | null;
  latestFollowUp?: {
    status: string;
    dueAt?: string;
  } | null;
  status?: ContactStatus;
};

const HUMAN_HANDOFF_ROUTE = "rota:chamar-humano";
const IN_PROGRESS_HANDOFF_ROUTE = "rota:atendimento-iniciado";
const RESOLVED_HANDOFF_ROUTE = "rota:handoff-resolvido";
const HANDOFF_SLA_WARNING_HOURS = 2;
const HANDOFF_SLA_OVERDUE_HOURS = 6;
const REPORT_TIME_ZONE = "America/Sao_Paulo";
const REPORT_TIME_ZONE_OFFSET = "-03:00";
const FOLLOWUP_SCHEDULED_EVENT = "crm_followup_agendado";
const FOLLOWUP_DONE_EVENT = "crm_followup_realizado";
const CONTACT_UPDATED_EVENT = "crm_contato_atualizado";
const QUICK_NOTE_EVENT = "crm_nota_rapida";
const COMMERCIAL_EVENT_TYPES = [
  "raio_x_lead_capturado",
  CONTACT_UPDATED_EVENT,
  QUICK_NOTE_EVENT,
  "crm_marcar_para_contato",
  "crm_contato_realizado",
  "crm_handoff_humano",
  "crm_atendimento_iniciado",
  "crm_handoff_resolvido",
  "crm_followup_agendado",
  "crm_followup_realizado",
  "crm_mensagem_copiada",
  "crm_mensagem_enviada",
  "crm_mensagem_bloqueada",
  "crm_whatsapp_enviado",
  "crm_whatsapp_envio_falhou",
  "whatsapp_mensagem_recebida",
  "whatsapp_intencao_comercial_detectada",
  "crm_lead_pausado",
  "crm_lead_reativado",
  "crm_lead_optout",
];

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
    take: filters.handoff || filters.inProgress || filters.resolved || filters.followup ? 250 : (filters.limit ?? 100),
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
        take: 20,
        select: {
          eventType: true,
          payload: true,
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
    latestFollowUp: getLatestFollowUp(contact.eventLogs),
    tags: contact.contactTags.map((contactTag) => contactTag.tag),
    quizSubmissions: undefined,
    leadScores: undefined,
    routeDecisions: undefined,
    eventLogs: undefined,
    contactTags: undefined,
  }));
  const visibleLeads = leads.filter((lead) => {
    if (filters.handoff && !isLeadInHandoffQueue(lead)) return false;
    if (filters.inProgress && !isLeadInProgressQueue(lead)) return false;
    if (filters.resolved && !isLeadResolvedQueue(lead)) return false;
    if (filters.followup && !isLeadInFollowUpQueue(lead)) return false;

    return true;
  });

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

  if (isMessageAction(input.action)) {
    const guardrail = checkMessageGuardrail(input.message ?? "");

    if (guardrail.status === "blocked") {
      await prisma.eventLog.create({
        data: {
          contactId,
          eventType: "crm_mensagem_bloqueada",
          payload: compactJson({
            action: input.action,
            note: "Mensagem bloqueada pelo guardrail",
            source: "crm",
            message: input.message,
            guardrail,
          }) as Prisma.InputJsonValue,
        },
      });

      return {
        ok: false,
        error: "message_blocked",
        guardrail,
        detail: await getLeadDetail(contactId),
      };
    }
  }

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

    if (input.action === "atendimento_iniciado") {
      await tx.routeDecision.create({
        data: {
          contactId,
          route: IN_PROGRESS_HANDOFF_ROUTE,
          reason: input.note || "atendimento humano iniciado no CRM",
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
          dueAt: input.dueAt,
          message: input.message,
        }) as Prisma.InputJsonValue,
      },
    });
  });

  return getLeadDetail(contactId);
}

export async function updateLeadContact(contactId: string, input: UpdateLeadContactInput) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      preferredChannel: true,
    },
  });

  if (!contact) return null;

  const data: Prisma.ContactUpdateInput = {};
  const changes: Record<string, { before: string | null; after: string | null }> = {};
  const nextPhone = hasOwn(input, "phone") ? normalizeEditableWhatsApp(input.phone) : undefined;

  if (nextPhone === false) {
    return {
      ok: false,
      error: "invalid_phone",
      field: "phone",
      message: "Informe um WhatsApp válido com DDI e DDD.",
      detail: await getLeadDetail(contactId),
    };
  }

  if (hasOwn(input, "name")) {
    const nextName = normalizeOptionalText(input.name);

    if ((contact.name ?? null) !== nextName) {
      data.name = nextName;
      changes.name = {
        before: contact.name ?? null,
        after: nextName,
      };
    }
  }

  if (hasOwn(input, "email")) {
    const nextEmail = normalizeEditableEmail(input.email);

    if (nextEmail) {
      const duplicate = await prisma.contact.findFirst({
        where: {
          id: { not: contactId },
          email: nextEmail,
        },
        select: { id: true },
      });

      if (duplicate) {
        return {
          ok: false,
          error: "duplicate_contact",
          field: "email",
          message: "Já existe outro lead com este e-mail.",
          detail: await getLeadDetail(contactId),
        };
      }
    }

    if ((contact.email ?? null) !== nextEmail) {
      data.email = nextEmail;
      changes.email = {
        before: contact.email ?? null,
        after: nextEmail,
      };
    }
  }

  if (nextPhone !== undefined) {
    if (nextPhone) {
      const duplicate = await prisma.contact.findFirst({
        where: {
          id: { not: contactId },
          phone: nextPhone,
        },
        select: { id: true },
      });

      if (duplicate) {
        return {
          ok: false,
          error: "duplicate_contact",
          field: "phone",
          message: "Já existe outro lead com este WhatsApp.",
          detail: await getLeadDetail(contactId),
        };
      }
    }

    if ((contact.phone ?? null) !== nextPhone) {
      data.phone = nextPhone;
      changes.phone = {
        before: contact.phone ?? null,
        after: nextPhone,
      };
    }

    if (nextPhone && contact.preferredChannel !== "whatsapp") {
      data.preferredChannel = "whatsapp";
      changes.preferredChannel = {
        before: contact.preferredChannel ?? null,
        after: "whatsapp",
      };
    }
  }

  if (!Object.keys(changes).length) {
    return getLeadDetail(contactId);
  }

  try {
    await prisma.$transaction([
      prisma.contact.update({
        where: { id: contactId },
        data,
      }),
      prisma.eventLog.create({
        data: {
          contactId,
          eventType: CONTACT_UPDATED_EVENT,
          payload: compactJson({
            action: "atualizar_contato",
            note: "Contato atualizado manualmente no CRM",
            source: "crm",
            changes,
          }) as Prisma.InputJsonValue,
        },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const field = getUniqueConstraintField(error.meta?.target);

      return {
        ok: false,
        error: "duplicate_contact",
        field,
        message:
          field === "phone"
            ? "Já existe outro lead com este WhatsApp."
            : "Já existe outro lead com este e-mail.",
        detail: await getLeadDetail(contactId),
      };
    }

    throw error;
  }

  return getLeadDetail(contactId);
}

export async function sendLeadWhatsAppMessage(contactId: string, input: SendWhatsAppMessageInput) {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
    select: {
      id: true,
      phone: true,
      status: true,
    },
  });

  if (!contact) return null;

  if (!contact.phone) {
    return {
      ok: false,
      error: "missing_phone",
      message: "Lead sem WhatsApp cadastrado.",
      detail: await getLeadDetail(contactId),
    };
  }

  if (contact.status === "optout") {
    return {
      ok: false,
      error: "lead_optout",
      message: "Lead está em opt-out.",
      detail: await getLeadDetail(contactId),
    };
  }

  const guardrail = checkMessageGuardrail(input.message);

  if (guardrail.status === "blocked") {
    await prisma.eventLog.create({
      data: {
        contactId,
        eventType: "crm_mensagem_bloqueada",
        payload: compactJson({
          action: "enviar_whatsapp",
          note: "Envio WhatsApp bloqueado pelo guardrail",
          source: "crm",
          channel: "whatsapp",
          message: input.message,
          guardrail,
        }) as Prisma.InputJsonValue,
      },
    });

    return {
      ok: false,
      error: "message_blocked",
      guardrail,
      detail: await getLeadDetail(contactId),
    };
  }

  try {
    const result = await sendUazapiTextMessage({
      number: normalizeWhatsAppNumber(contact.phone),
      text: input.message,
    });

    await prisma.$transaction([
      prisma.contact.update({
        where: { id: contactId },
        data: { updatedAt: new Date() },
      }),
      prisma.eventLog.create({
        data: {
          contactId,
          eventType: "crm_whatsapp_enviado",
          payload: compactJson({
            action: "enviar_whatsapp",
            note: "Mensagem enviada pelo backend via UAZAPI",
            source: "crm",
            channel: "whatsapp",
            provider: "uazapi",
            providerStatus: result.status,
            message: input.message,
          }) as Prisma.InputJsonValue,
        },
      }),
    ]);

    return {
      ok: true,
      channel: "whatsapp",
      provider: "uazapi",
      providerStatus: result.status,
      detail: await getLeadDetail(contactId),
    };
  } catch (error) {
    await prisma.eventLog.create({
      data: {
        contactId,
        eventType: "crm_whatsapp_envio_falhou",
        payload: compactJson({
          action: "enviar_whatsapp",
          note: getWhatsAppSendFailureMessage(error),
          source: "crm",
          channel: "whatsapp",
          provider: "uazapi",
          message: input.message,
        }) as Prisma.InputJsonValue,
      },
    });

    return {
      ok: false,
      error: getWhatsAppSendFailureCode(error),
      message: getWhatsAppSendFailureMessage(error),
      detail: await getLeadDetail(contactId),
    };
  }
}

export async function getCrmReport(filters: CrmReportFilters) {
  const period = resolveReportPeriod(filters);

  const [totalContacts, contacts, recentContacts, recentEvents] = await prisma.$transaction([
    prisma.contact.count({
      where: {
        deletedAt: null,
      },
    }),
    prisma.contact.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { updatedAt: "desc" },
      take: 1000,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        updatedAt: true,
        createdAt: true,
        quizSubmissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            gargalo: true,
            source: true,
            submittedAt: true,
          },
        },
        leadScores: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            score: true,
            classification: true,
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
          take: 20,
          select: {
            eventType: true,
            payload: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.contact.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: period.since,
          lte: period.until,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.eventLog.findMany({
      where: {
        createdAt: {
          gte: period.since,
          lte: period.until,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        eventType: true,
        payload: true,
        createdAt: true,
        contact: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    }),
  ]);

  const leadItems = contacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    email: contact.email,
    phone: contact.phone,
    status: contact.status,
    updatedAt: contact.updatedAt,
    latestQuizSubmission: contact.quizSubmissions[0] ?? null,
    latestScore: contact.leadScores[0] ?? null,
    latestRoute: contact.routeDecisions[0] ?? null,
    latestFollowUp: getLatestFollowUp(contact.eventLogs),
  }));

  const handoffCount = leadItems.filter(isLeadInHandoffQueue).length;
  const inProgressCount = leadItems.filter(isLeadInProgressQueue).length;
  const resolvedCount = leadItems.filter(isLeadResolvedQueue).length;
  const followUpCount = leadItems.filter(isLeadInFollowUpQueue).length;
  const activeCount = contacts.filter((contact) => contact.status === "active").length;
  const optOutCount = contacts.filter((contact) => contact.status === "optout").length;
  const funnel = summarizeAttendanceFunnel(leadItems);
  const sla = summarizeHandoffSla(leadItems);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    period: {
      days: period.days,
      since: period.since.toISOString(),
      until: period.until.toISOString(),
      dateFrom: period.dateFrom,
      dateTo: period.dateTo,
    },
    totals: {
      contacts: totalContacts,
      active: activeCount,
      optOut: optOutCount,
      newContacts: recentContacts.length,
      handoff: handoffCount,
      inProgress: inProgressCount,
      resolved: resolvedCount,
      followUp: followUpCount,
    },
    funnel,
    sla,
    byGargalo: countBy(leadItems, (lead) => lead.latestQuizSubmission?.gargalo ?? "sem_gargalo"),
    byClassification: countBy(leadItems, (lead) => lead.latestScore?.classification ?? "sem_score"),
    byRoute: countBy(leadItems, (lead) => lead.latestRoute?.route ?? "sem_rota"),
    leadsByDay: countDates(recentContacts.map((contact) => contact.createdAt)),
    events: summarizeCommercialEvents(recentEvents),
    latestEvents: recentEvents.slice(0, 12).map((event) => ({
      eventType: event.eventType,
      createdAt: event.createdAt,
      contact: event.contact,
      note: extractStringFromJson(event.payload, "note"),
    })),
    oldestOpenHandoffs: getOldestOpenHandoffs(leadItems),
    latestResolvedHandoffs: getLatestResolvedHandoffs(leadItems),
  };
}

function resolveReportPeriod(filters: CrmReportFilters) {
  if (filters.dateFrom && filters.dateTo) {
    const since = new Date(`${filters.dateFrom}T00:00:00.000${REPORT_TIME_ZONE_OFFSET}`);
    const until = new Date(`${filters.dateTo}T23:59:59.999${REPORT_TIME_ZONE_OFFSET}`);
    const days = Math.max(1, Math.ceil((until.getTime() - since.getTime()) / (24 * 60 * 60 * 1000)));

    return {
      days,
      since,
      until,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    };
  }

  const days = filters.days ?? 14;
  const until = new Date();
  const since = new Date(until.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    days,
    since,
    until,
    dateFrom: formatReportDateInput(since),
    dateTo: formatReportDateInput(until),
  };
}

function formatReportDateInput(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REPORT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const partByType = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${partByType.year}-${partByType.month}-${partByType.day}`;
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
    atendimento_iniciado: "crm_atendimento_iniciado",
    resolver_handoff: "crm_handoff_resolvido",
    agendar_followup: FOLLOWUP_SCHEDULED_EVENT,
    followup_realizado: FOLLOWUP_DONE_EVENT,
    nota_rapida: QUICK_NOTE_EVENT,
    mensagem_copiada: "crm_mensagem_copiada",
    mensagem_enviada: "crm_mensagem_enviada",
    pausar: "crm_lead_pausado",
    reativar: "crm_lead_reativado",
    optout: "crm_lead_optout",
  };

  return eventTypeByAction[action];
}

function isMessageAction(action: LeadActionInput["action"]) {
  return action === "mensagem_copiada" || action === "mensagem_enviada";
}

function isLeadInHandoffQueue(lead: LeadSummaryItem) {
  if (lead.latestRoute?.route === IN_PROGRESS_HANDOFF_ROUTE) return false;
  if (lead.latestRoute?.route === RESOLVED_HANDOFF_ROUTE) return false;

  return lead.latestRoute?.route === HUMAN_HANDOFF_ROUTE || lead.latestScore?.classification === "prioridade";
}

function isLeadInProgressQueue(lead: LeadSummaryItem) {
  return lead.status !== "optout" && lead.latestRoute?.route === IN_PROGRESS_HANDOFF_ROUTE;
}

function isLeadResolvedQueue(lead: LeadSummaryItem) {
  return lead.status !== "optout" && lead.latestRoute?.route === RESOLVED_HANDOFF_ROUTE;
}

function isLeadInFollowUpQueue(lead: LeadSummaryItem) {
  return lead.status !== "optout" && lead.latestFollowUp?.status === "pending";
}

function summarizeAttendanceFunnel(leads: LeadSummaryItem[]) {
  const handoff = leads.filter(isLeadInHandoffQueue).length;
  const inProgress = leads.filter(isLeadInProgressQueue).length;
  const resolved = leads.filter(isLeadResolvedQueue).length;
  const total = handoff + inProgress + resolved;

  return {
    handoff,
    inProgress,
    resolved,
    total,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
  };
}

function summarizeHandoffSla(leads: LeadSummaryItem[]) {
  const openItems = leads.filter(isLeadInHandoffQueue).map(toReportLeadItem);

  return {
    warningHours: HANDOFF_SLA_WARNING_HOURS,
    overdueHours: HANDOFF_SLA_OVERDUE_HOURS,
    open: openItems.length,
    attention: openItems.filter((lead) => lead.slaStatus === "attention").length,
    overdue: openItems.filter((lead) => lead.slaStatus === "overdue").length,
  };
}

function getOldestOpenHandoffs(leads: LeadSummaryItem[]) {
  return leads
    .filter(isLeadInHandoffQueue)
    .map(toReportLeadItem)
    .sort((a, b) => new Date(a.since).getTime() - new Date(b.since).getTime())
    .slice(0, 8);
}

function getLatestResolvedHandoffs(leads: LeadSummaryItem[]) {
  return leads
    .filter(isLeadResolvedQueue)
    .map(toReportLeadItem)
    .sort((a, b) => new Date(b.since).getTime() - new Date(a.since).getTime())
    .slice(0, 8);
}

function toReportLeadItem(lead: LeadSummaryItem) {
  const since = lead.latestRoute?.createdAt ?? lead.updatedAt ?? new Date();

  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    route: lead.latestRoute?.route,
    reason: lead.latestRoute?.reason,
    gargalo: lead.latestQuizSubmission?.gargalo,
    score: lead.latestScore?.score,
    classification: lead.latestScore?.classification,
    since,
    ageHours: Math.max(0, Math.round((Date.now() - since.getTime()) / (60 * 60 * 1000))),
    slaStatus: getHandoffSlaStatus(since),
  };
}

function getHandoffSlaStatus(since: Date) {
  const ageHours = Math.max(0, Math.round((Date.now() - since.getTime()) / (60 * 60 * 1000)));

  if (ageHours >= HANDOFF_SLA_OVERDUE_HOURS) return "overdue";
  if (ageHours >= HANDOFF_SLA_WARNING_HOURS) return "attention";

  return "ok";
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

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return Object.entries(
    items.reduce<Record<string, number>>((accumulator, item) => {
      const key = getKey(item);
      accumulator[key] = (accumulator[key] ?? 0) + 1;

      return accumulator;
    }, {}),
  )
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function countDates(dates: Date[]) {
  return Object.entries(
    dates.reduce<Record<string, number>>((accumulator, date) => {
      const key = date.toISOString().slice(0, 10);
      accumulator[key] = (accumulator[key] ?? 0) + 1;

      return accumulator;
    }, {}),
  )
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function summarizeCommercialEvents(events: Array<{ eventType: string }>) {
  const relevantEvents = events.filter((event) => COMMERCIAL_EVENT_TYPES.includes(event.eventType));

  return {
    handoffs: relevantEvents.filter((event) => event.eventType === "crm_handoff_humano").length,
    handoffsStarted: relevantEvents.filter((event) => event.eventType === "crm_atendimento_iniciado").length,
    handoffsResolved: relevantEvents.filter((event) => event.eventType === "crm_handoff_resolvido").length,
    followUpsScheduled: relevantEvents.filter((event) => event.eventType === FOLLOWUP_SCHEDULED_EVENT).length,
    followUpsDone: relevantEvents.filter((event) => event.eventType === FOLLOWUP_DONE_EVENT).length,
    messagesCopied: relevantEvents.filter((event) => event.eventType === "crm_mensagem_copiada").length,
    messagesSent: relevantEvents.filter((event) => event.eventType === "crm_mensagem_enviada").length,
    whatsAppSent: relevantEvents.filter((event) => event.eventType === "crm_whatsapp_enviado").length,
    whatsAppFailed: relevantEvents.filter((event) => event.eventType === "crm_whatsapp_envio_falhou").length,
    whatsAppReceived: relevantEvents.filter((event) => event.eventType === "whatsapp_mensagem_recebida").length,
    whatsAppCommercialIntents: relevantEvents.filter(
      (event) => event.eventType === "whatsapp_intencao_comercial_detectada",
    ).length,
    contactsDone: relevantEvents.filter((event) => event.eventType === "crm_contato_realizado").length,
    contactUpdates: relevantEvents.filter((event) => event.eventType === CONTACT_UPDATED_EVENT).length,
    quickNotes: relevantEvents.filter((event) => event.eventType === QUICK_NOTE_EVENT).length,
  };
}

function getLatestFollowUp(events: Array<{ eventType: string; payload: Prisma.JsonValue; createdAt: Date }>) {
  const latestFollowUpEvent = events.find((event) =>
    [FOLLOWUP_SCHEDULED_EVENT, FOLLOWUP_DONE_EVENT].includes(event.eventType),
  );

  if (!latestFollowUpEvent) return null;

  const payload = isJsonObject(latestFollowUpEvent.payload) ? latestFollowUpEvent.payload : {};

  if (latestFollowUpEvent.eventType === FOLLOWUP_DONE_EVENT) {
    return {
      status: "done",
      dueAt: typeof payload.dueAt === "string" ? payload.dueAt : undefined,
      createdAt: latestFollowUpEvent.createdAt,
    };
  }

  return {
    status: "pending",
    dueAt: typeof payload.dueAt === "string" ? payload.dueAt : undefined,
    note: typeof payload.note === "string" ? payload.note : undefined,
    createdAt: latestFollowUpEvent.createdAt,
  };
}

function isJsonObject(value: Prisma.JsonValue): value is Prisma.JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractStringFromJson(value: Prisma.JsonValue, key: string) {
  if (!isJsonObject(value)) return undefined;
  const item = value[key];

  return typeof item === "string" ? item : undefined;
}

function normalizeWhatsAppNumber(phone: string) {
  return phone.replace(/\D/g, "");
}

function normalizeEditableEmail(email?: string) {
  return normalizeOptionalText(email)?.toLowerCase() ?? null;
}

function normalizeEditableWhatsApp(phone?: string) {
  const rawValue = normalizeOptionalText(phone);
  if (!rawValue) return null;

  const digits = rawValue.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return false;

  return digits;
}

function normalizeOptionalText(value?: string) {
  const text = value?.trim();

  return text ? text : null;
}

function hasOwn<T extends object>(value: T, key: PropertyKey) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function getUniqueConstraintField(target: unknown): "email" | "phone" {
  if (Array.isArray(target) && target.includes("phone")) return "phone";
  if (typeof target === "string" && target.includes("phone")) return "phone";

  return "email";
}

function getWhatsAppSendFailureCode(error: unknown) {
  if (error instanceof UazapiConfigurationError) return "uazapi_not_configured";
  if (error instanceof UazapiRequestError) return "uazapi_request_failed";

  return "whatsapp_send_failed";
}

function getWhatsAppSendFailureMessage(error: unknown) {
  if (error instanceof UazapiConfigurationError) return "UAZAPI não configurada.";
  if (error instanceof UazapiRequestError) return `UAZAPI retornou erro ${error.status}.`;

  return "Falha ao enviar mensagem pelo WhatsApp.";
}

function compactJson(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
