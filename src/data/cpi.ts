import { z } from "zod";

export const cpiSchema = z.object({
  series: z.string().min(1),
  values: z
    .record(z.string().regex(/^\d{4}$/), z.number().positive())
    .refine(values => Object.keys(values).length > 0, "CPI needs at least one annual observation"),
  sources: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1),
});
export type CpiData = z.infer<typeof cpiSchema>;
