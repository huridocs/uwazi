import { z } from 'zod';
import { SEMANTIC_VAR_KEYS } from './tokens.js';
import type { SemanticVarKey, ThemeMode } from './tokens.js';
import { isValidHex, normalizeHex } from './themePaletteSort.js';
import {
  CHROME_OVERRIDE_VAR_KEYS,
  fillChromeImportDefaults,
  type ChromeOverrideVarKey,
} from './themeChromeOverrides.js';

const storageKey = (mode: ThemeMode, key: string) => `${mode}:${key}`;

const semanticKeySchema = z.enum(SEMANTIC_VAR_KEYS);

const hexField = z
  .string()
  .transform(s => normalizeHex(s.trim()))
  .pipe(z.string().refine(isValidHex, { message: 'invalid hex color' }));

const modeVarsSchema = z.record(semanticKeySchema, hexField);

const chromeKeySchema = z.enum(CHROME_OVERRIDE_VAR_KEYS);

const modeChromeSchema = z.record(chromeKeySchema, hexField);

const themeInstanceFileSchema = z
  .object({
    id: z.string().optional(),
    light: modeVarsSchema.optional(),
    dark: modeVarsSchema.optional(),
    chrome: z
      .object({
        light: modeChromeSchema.optional(),
        dark: modeChromeSchema.optional(),
      })
      .optional(),
  })
  .refine(
    data =>
      Object.keys(data.light ?? {}).length +
        Object.keys(data.dark ?? {}).length +
        Object.keys(data.chrome?.light ?? {}).length +
        Object.keys(data.chrome?.dark ?? {}).length >
      0,
    { message: 'empty theme' }
  );

type ThemeInstanceFile = z.infer<typeof themeInstanceFileSchema>;

const flattenModeVars = (mode: ThemeMode, vars: Partial<Record<SemanticVarKey, string>>) => {
  const out: Record<string, string> = {};
  (Object.entries(vars) as [SemanticVarKey, string][]).forEach(([key, value]) => {
    out[storageKey(mode, key)] = value;
  });
  return out;
};

const flattenChromeMode = (
  mode: ThemeMode,
  vars: Partial<Record<ChromeOverrideVarKey, string>>
) => {
  const filled = fillChromeImportDefaults(vars);
  const out: Record<string, string> = {};
  (Object.entries(filled) as [ChromeOverrideVarKey, string][]).forEach(([key, value]) => {
    out[storageKey(mode, key)] = value;
  });
  return out;
};

const parseThemeInstanceImportJson = (
  raw: unknown
): { flat: Record<string, string> } | { error: string } => {
  const parsed = themeInstanceFileSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'invalid file' };
  }
  const data: ThemeInstanceFile = parsed.data;
  const flat: Record<string, string> = {};
  if (data.light) Object.assign(flat, flattenModeVars('light', data.light));
  if (data.dark) Object.assign(flat, flattenModeVars('dark', data.dark));
  if (data.chrome?.light) Object.assign(flat, flattenChromeMode('light', data.chrome.light));
  if (data.chrome?.dark) Object.assign(flat, flattenChromeMode('dark', data.chrome.dark));
  return { flat };
};

export { parseThemeInstanceImportJson };
export type { ThemeInstanceFile };
