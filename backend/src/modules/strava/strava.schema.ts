import { z } from "zod";

export const stravaExchangeSchema = z.object({
  code: z.string().min(1, "code is required"),
  state: z.string().min(1, "state is required"),
});
