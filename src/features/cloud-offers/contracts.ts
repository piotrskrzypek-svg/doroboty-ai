import { z } from "zod";
import { jobSchema } from "../prototype/model";

export const cloudOfferDataSchema = jobSchema.safeExtend({
  id: z.uuid(),
  companyId: z.literal("supabase-employer"),
  publicationStatus: z.literal("draft"),
  verificationStatus: z.literal("unverified"),
});
export const offerRowSchema = z
  .object({
    id: z.uuid(),
    data: cloudOfferDataSchema,
    revision: z.number().int().positive(),
    updated_at: z.string().min(1),
  })
  .refine((row) => row.id === row.data.id, "Offer identity mismatch");
export type CloudOffer = z.infer<typeof cloudOfferDataSchema>;
export type OfferRow = z.infer<typeof offerRowSchema>;
