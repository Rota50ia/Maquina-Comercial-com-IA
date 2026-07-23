import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./shared/config/env.js";
import { registerHealthRoutes } from "./modules/health/routes.js";
import { registerQuizRoutes } from "./modules/quiz/routes.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "info" : "debug",
    },
  });

  await app.register(cors, {
    origin: env.APP_ORIGIN === "*" ? true : env.APP_ORIGIN,
  });

  app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => {
    request.log.error({ err: error }, "request failed");
    const statusCode =
      typeof error.statusCode === "number" && error.statusCode >= 400 ? error.statusCode : 500;

    reply.status(statusCode).send({
      ok: false,
      error: statusCode === 500 ? "internal_error" : error.message,
    });
  });

  await registerHealthRoutes(app);
  await registerQuizRoutes(app);

  return app;
}
