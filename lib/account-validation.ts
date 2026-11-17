import { z } from "zod";

// Existing credentials are checked by Auth. The new-password policy applies
// only when creating or changing a password, never when signing in.
export const loginCredentials = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});
export const registrationCredentials = loginCredentials.extend({
  password: z.string().min(12).max(128),
});
