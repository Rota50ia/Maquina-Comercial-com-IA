import type { FastifyReply, FastifyRequest } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { env } from "../../shared/config/env.js";

export function validateDashboardAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!env.DASHBOARD_USER || !env.DASHBOARD_PASSWORD) {
    if (env.NODE_ENV === "production") {
      return reply.status(503).send({
        ok: false,
        error: "dashboard_auth_not_configured",
      });
    }

    return;
  }

  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Basic ")) {
    return unauthorized(reply);
  }

  const credentials = Buffer.from(authorization.slice("Basic ".length), "base64")
    .toString("utf8")
    .split(":");
  const username = credentials.shift() ?? "";
  const password = credentials.join(":");

  if (!secureCompare(username, env.DASHBOARD_USER) || !secureCompare(password, env.DASHBOARD_PASSWORD)) {
    return unauthorized(reply);
  }
}

function unauthorized(reply: FastifyReply) {
  return reply
    .header("WWW-Authenticate", 'Basic realm="Maquina Comercial CRM", charset="UTF-8"')
    .status(401)
    .send({
      ok: false,
      error: "unauthorized",
    });
}

function secureCompare(input: string, expected: string) {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);

  if (inputBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(inputBuffer, expectedBuffer);
}
