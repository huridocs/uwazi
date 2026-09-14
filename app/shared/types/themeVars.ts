import { z } from 'zod';

const themeVarsSchema = z.record(z.string().max(512).optional());

type ThemeVars = z.infer<typeof themeVarsSchema>;

export { themeVarsSchema };
export type { ThemeVars };
