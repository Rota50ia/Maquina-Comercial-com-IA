import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { Contact, Prisma } from "@prisma/client";
import { env } from "../../shared/config/env.js";
import { prisma } from "../../shared/db/prisma.js";

type UazapiWebhookParams = {
  event?: string;
  type?: string;
};

type InboundMessage = {
  event?: string;
  type?: string;
  chatId?: string;
  phone?: string;
  messageId?: string;
  fromMe: boolean;
  isGroup: boolean;
  senderName?: string;
  text?: string;
  timestamp?: Date;
  instance?: string;
  raw: Record<string, unknown>;
};

const RECEIVED_MESSAGE_EVENT = "whatsapp_mensagem_recebida";
const IGNORED_MESSAGE_EVENT = "uazapi_mensagem_ignorada";

export async function registerUazapiWebhookRoutes(app: FastifyInstance) {
  app.post("/webhooks/uazapi", handleUazapiWebhook);
  app.post<{ Params: UazapiWebhookParams }>("/webhooks/uazapi/:event", handleUazapiWebhook);
  app.post<{ Params: UazapiWebhookParams }>("/webhooks/uazapi/:event/:type", handleUazapiWebhook);
}

async function handleUazapiWebhook(request: FastifyRequest, reply: FastifyReply) {
  validateWebhookSecret(request);

  const params = isRecord(request.params) ? request.params : {};
  const result = await processUazapiWebhook(request.body, {
    event: typeof params.event === "string" ? params.event : undefined,
    type: typeof params.type === "string" ? params.type : undefined,
  });

  return reply.status(202).send({
    ok: true,
    ...result,
  });
}

async function processUazapiWebhook(payload: unknown, route: UazapiWebhookParams) {
  if (!isRecord(payload)) {
    await prisma.eventLog.create({
      data: {
        eventType: IGNORED_MESSAGE_EVENT,
        payload: {
          reason: "payload_invalido",
          source: "uazapi",
        },
      },
    });

    return {
      received: 0,
      ignored: 1,
    };
  }

  const messages = extractInboundMessages(payload, route);
  let received = 0;
  let ignored = 0;

  for (const message of messages) {
    if (message.fromMe || message.isGroup || !message.phone) {
      ignored += 1;
      await logIgnoredMessage(message);
      continue;
    }

    const contact = await findOrCreateWhatsAppContact(message);
    await prisma.eventLog.create({
      data: {
        contactId: contact.id,
        eventType: RECEIVED_MESSAGE_EVENT,
        payload: compactJson({
          source: "uazapi",
          channel: "whatsapp",
          event: message.event,
          type: message.type,
          chatId: message.chatId,
          phone: message.phone,
          messageId: message.messageId,
          senderName: message.senderName,
          message: message.text,
          receivedAt: message.timestamp?.toISOString(),
          instance: message.instance,
        }) as Prisma.InputJsonValue,
      },
    });
    received += 1;
  }

  return {
    received,
    ignored,
  };
}

function extractInboundMessages(payload: Record<string, unknown>, route: UazapiWebhookParams): InboundMessage[] {
  const candidates = getMessageCandidates(payload);
  const event = stringValue(payload.event) ?? route.event;
  const type = stringValue(payload.type) ?? route.type;

  if (!candidates.length && event !== "messages") {
    return [];
  }

  return (candidates.length ? candidates : [payload]).filter(isRecord).map((message) => {
    const key = recordValue(message.key);
    const nestedMessage = recordValue(message.message);
    const chatId =
      stringValue(message.chatid) ??
      stringValue(message.chatId) ??
      stringValue(message.remoteJid) ??
      stringValue(key?.remoteJid) ??
      stringValue(key?.chatid) ??
      stringValue(payload.chatid) ??
      stringValue(payload.chatId);
    const senderPhone =
      stringValue(message.senderPn) ??
      stringValue(message.cleanedSenderPn) ??
      stringValue(message.from) ??
      stringValue(payload.from);
    const text =
      stringValue(message.text) ??
      stringValue(message.body) ??
      stringValue(message.messageBody) ??
      stringValue(message.content) ??
      stringValue(nestedMessage?.conversation) ??
      stringValue(recordValue(nestedMessage?.extendedTextMessage)?.text) ??
      stringValue(recordValue(nestedMessage?.textMessage)?.text);

    return {
      event,
      type,
      chatId,
      phone: normalizePhoneFromJid(chatId) ?? normalizePhoneFromJid(senderPhone),
      messageId:
        stringValue(message.messageid) ??
        stringValue(message.messageId) ??
        stringValue(message.id) ??
        stringValue(key?.id),
      fromMe: booleanValue(message.fromMe) ?? booleanValue(key?.fromMe) ?? false,
      isGroup: Boolean(chatId?.includes("@g.us")),
      senderName:
        stringValue(message.pushName) ??
        stringValue(message.senderName) ??
        stringValue(message.notifyName) ??
        stringValue(payload.pushName) ??
        stringValue(payload.senderName),
      text,
      timestamp: parseTimestamp(message.messageTimestamp ?? message.timestamp ?? payload.timestamp),
      instance: getInstanceName(payload),
      raw: compactJson({
        event,
        type,
        chatId,
        id: stringValue(message.id),
        messageid: stringValue(message.messageid),
        fromMe: booleanValue(message.fromMe),
      }),
    };
  });
}

function getMessageCandidates(payload: Record<string, unknown>) {
  const data = recordValue(payload.data);
  const candidates = [
    ...arrayValue(payload.messages),
    ...arrayValue(data?.messages),
    recordValue(payload.message),
    recordValue(data?.message),
  ].filter(isRecord);

  return candidates;
}

async function findOrCreateWhatsAppContact(message: InboundMessage): Promise<Contact> {
  const existing = await prisma.contact.findFirst({
    where: {
      phone: message.phone,
      deletedAt: null,
    },
  });

  if (!existing) {
    return prisma.contact.create({
      data: {
        name: message.senderName,
        phone: message.phone,
        preferredChannel: "whatsapp",
        consentSource: "uazapi-inbound",
      },
    });
  }

  return prisma.contact.update({
    where: { id: existing.id },
    data: compactJson({
      name: existing.name ? undefined : message.senderName,
      preferredChannel: "whatsapp",
      updatedAt: new Date(),
    }),
  });
}

async function logIgnoredMessage(message: InboundMessage) {
  await prisma.eventLog.create({
    data: {
      eventType: IGNORED_MESSAGE_EVENT,
      payload: compactJson({
        reason: getIgnoredReason(message),
        source: "uazapi",
        event: message.event,
        type: message.type,
        chatId: message.chatId,
        messageId: message.messageId,
        fromMe: message.fromMe,
        isGroup: message.isGroup,
      }) as Prisma.InputJsonValue,
    },
  });
}

function validateWebhookSecret(request: FastifyRequest) {
  if (!env.WEBHOOK_SECRET) return;

  const headerSecret = request.headers["x-maquina-webhook-token"];
  const querySecret = getQuerySecret(request);

  if (headerSecret !== env.WEBHOOK_SECRET && querySecret !== env.WEBHOOK_SECRET) {
    const error = new Error("Webhook não autorizado.");
    Object.assign(error, { statusCode: 401 });
    throw error;
  }
}

function getQuerySecret(request: FastifyRequest) {
  if (!isRecord(request.query)) return undefined;

  return stringValue(request.query.token) ?? stringValue(request.query.secret);
}

function getIgnoredReason(message: InboundMessage) {
  if (message.fromMe) return "mensagem_enviada_pela_api";
  if (message.isGroup) return "mensagem_de_grupo";
  if (!message.phone) return "telefone_nao_identificado";

  return "mensagem_ignorada";
}

function getInstanceName(payload: Record<string, unknown>) {
  const instance = recordValue(payload.instance);

  return stringValue(instance?.name) ?? stringValue(instance?.id) ?? stringValue(payload.instance);
}

function normalizePhoneFromJid(value?: string) {
  const digits = value?.split("@")[0]?.replace(/\D/g, "");

  return digits && digits.length >= 10 && digits.length <= 15 ? digits : undefined;
}

function parseTimestamp(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return undefined;

  return new Date(numeric > 10_000_000_000 ? numeric : numeric * 1000);
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;

  return undefined;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function recordValue(value: unknown) {
  return isRecord(value) ? value : undefined;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compactJson(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}
