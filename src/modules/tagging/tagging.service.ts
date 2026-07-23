import { prisma } from "../../shared/db/prisma.js";

const gargaloTagMap: Record<string, string[]> = {
  promessa: ["gargalo:promessa", "dor:crenca-e-mecanismo", "rota:mapa-promessa"],
  criativo: ["gargalo:criativo", "dor:hook-e-angulo", "rota:mapa-criativo"],
  vsl: ["gargalo:vsl", "dor:retencao-e-pitch", "rota:mapa-vsl"],
  pagina: ["gargalo:pagina", "dor:pagina-e-conversao", "rota:mapa-pagina"],
  oferta: ["gargalo:oferta", "dor:valor-percebido", "rota:mapa-oferta"],
  checkout: ["gargalo:checkout", "dor:decisao-de-compra", "rota:mapa-checkout"],
  followup: ["gargalo:followup", "dor:lead-esfriando", "rota:mapa-followup"],
  politica: ["gargalo:qualidade-percebida", "dor:risco-de-promessa", "rota:mapa-qualidade"],
  diagnostico: ["gargalo:diagnostico-geral", "dor:falta-de-clareza", "rota:mapa-diagnostico"],
};

export function getQuizTags(gargalo: string) {
  return [
    "origem:raio-x-anti-algoritmo",
    "funil:quiz-raio-x",
    "idioma:pt-br",
    "produto-entrada:mapa-do-gargalo",
    "produto-proximo:campanhas-2026",
    "canal:whatsapp",
    "canal:email",
    "rota:entregar-mapa-do-gargalo",
    ...(gargaloTagMap[gargalo] || ["gargalo:desconhecido"]),
  ];
}

export async function applyTags(contactId: string, tags: string[], source: string) {
  for (const key of tags) {
    const tag = await prisma.tag.upsert({
      where: { key },
      create: { key, label: key },
      update: {},
    });

    await prisma.contactTag.upsert({
      where: { contactId_tagId: { contactId, tagId: tag.id } },
      create: { contactId, tagId: tag.id, source },
      update: {},
    });
  }
}

