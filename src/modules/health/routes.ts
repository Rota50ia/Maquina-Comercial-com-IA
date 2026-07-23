import type { FastifyInstance } from "fastify";
import { prisma } from "../../shared/db/prisma.js";

export async function registerHealthRoutes(app: FastifyInstance) {
  app.get("/health", async () => {
    await prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      service: "maquina-comercial-ia",
      timestamp: new Date().toISOString(),
    };
  });
}

