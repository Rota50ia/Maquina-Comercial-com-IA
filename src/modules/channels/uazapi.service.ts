import { env } from "../../shared/config/env.js";

export type UazapiTextMessageInput = {
  number: string;
  text: string;
};

export type UazapiTextMessageResult = {
  status: number;
  body: unknown;
};

export function isUazapiConfigured() {
  return Boolean(env.UAZAPI_BASE_URL && env.UAZAPI_TOKEN);
}

export async function sendUazapiTextMessage(input: UazapiTextMessageInput): Promise<UazapiTextMessageResult> {
  if (!env.UAZAPI_BASE_URL || !env.UAZAPI_TOKEN) {
    throw new UazapiConfigurationError();
  }

  const response = await fetch(new URL("/send/text", env.UAZAPI_BASE_URL), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      convert: "true",
      token: env.UAZAPI_TOKEN,
    },
    body: JSON.stringify({
      number: input.number,
      text: input.text,
      linkPreview: false,
      replyid: "",
      mentions: "",
      readchat: true,
      delay: 0,
    }),
  });

  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new UazapiRequestError(response.status, body);
  }

  return {
    status: response.status,
    body,
  };
}

export class UazapiConfigurationError extends Error {
  constructor() {
    super("UAZAPI não configurada.");
    this.name = "UazapiConfigurationError";
  }
}

export class UazapiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super("Falha ao enviar mensagem pela UAZAPI.");
    this.name = "UazapiRequestError";
  }
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
