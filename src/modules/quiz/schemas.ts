import { z } from "zod";

const scoreKeySchema = z.enum([
  "promessa",
  "criativo",
  "vsl",
  "pagina",
  "oferta",
  "checkout",
  "followup",
  "politica",
  "diagnostico",
]);

export const quizAnswerSchema = z.object({
  pergunta_numero: z.number().int().positive(),
  pergunta: z.string().min(1),
  resposta: z.string().min(1),
  scores: z.array(scoreKeySchema).default([]),
});

export const quizWebhookSchema = z.object({
  nome: z.string().trim().min(1).optional(),
  email: z.string().trim().email().optional(),
  whatsapp: z.string().trim().min(6).optional(),
  instagram: z.string().trim().optional(),
  gargalo: scoreKeySchema,
  resultado: z.string().trim().min(1),
  origem: z.string().trim().default("raio_x_anti_algoritmo"),
  page: z.string().trim().optional(),
  idioma: z.string().trim().default("pt-BR"),
  quiz_versao: z.string().trim().optional(),
  timestamp: z.string().trim().optional(),
  segunda_categoria: scoreKeySchema.optional(),
  scores: z.record(scoreKeySchema, z.number().int().nonnegative()).optional(),
  respostas: z.array(quizAnswerSchema).optional(),
  acoes_recomendadas: z.array(z.string()).optional(),
  cta_resultado: z.string().optional(),
  utm: z
    .object({
      source: z.string().optional(),
      medium: z.string().optional(),
      campaign: z.string().optional(),
      content: z.string().optional(),
      term: z.string().optional(),
    })
    .optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
});

export type QuizWebhookInput = z.infer<typeof quizWebhookSchema>;

