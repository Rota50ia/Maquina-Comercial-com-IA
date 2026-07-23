import type { Contact } from "@prisma/client";
import { prisma } from "../../shared/db/prisma.js";

export type UpsertContactInput = {
  name?: string;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  preferredChannel?: string;
  consentSource?: string;
};

export function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase() || undefined;
}

export function normalizePhone(phone?: string) {
  const digits = phone?.replace(/\D/g, "");
  return digits && digits.length >= 6 ? digits : undefined;
}

export async function findOrCreateContact(input: UpsertContactInput): Promise<Contact> {
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);

  if (!email && !phone && !input.instagramHandle) {
    throw new Error("Lead sem telefone, e-mail ou Instagram.");
  }

  const existing = await prisma.contact.findFirst({
    where: {
      OR: [
        ...(phone ? [{ phone }] : []),
        ...(email ? [{ email }] : []),
        ...(input.instagramHandle ? [{ instagramHandle: input.instagramHandle }] : []),
      ],
    },
  });

  const data = {
    name: input.name,
    email,
    phone,
    instagramHandle: input.instagramHandle,
    preferredChannel: input.preferredChannel,
    consentSource: input.consentSource,
  };

  if (!existing) {
    return prisma.contact.create({ data });
  }

  return prisma.contact.update({
    where: { id: existing.id },
    data: removeUndefined(data),
  });
}

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

