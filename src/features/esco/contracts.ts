import { z } from "zod";

export const occupationUri = z
  .string()
  .regex(/^http:\/\/data\.europa\.eu\/esco\/occupation\/[0-9a-f-]{36}$/);
export const skillSchema = z.object({
  uri: z.string().regex(/^http:\/\/data\.europa\.eu\/esco\/skill\/[0-9a-f-]{36}$/),
  label: z.string().min(1).max(500),
  essential: z.boolean(),
});
export const escoProfileSchema = z.object({
  uri: occupationUri,
  label: z.string().min(1).max(500),
  description: z.string().max(12000),
  language: z.literal("pl"),
  skills: z.array(skillSchema).max(200),
});
export const searchResponseSchema = z.object({
  query: z.string(),
  results: z.array(z.object({ uri: occupationUri, label: z.string().min(1).max(500) })).max(8),
});
export type EscoProfile = z.infer<typeof escoProfileSchema>;
