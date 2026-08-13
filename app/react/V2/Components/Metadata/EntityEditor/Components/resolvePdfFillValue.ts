import { coerceValue } from '#V2/api/entities/index.js';
import { parseLocalizedDate } from '#V2/shared/dateHelpers.js';
import type { PdfFillCoerceType } from './pdfFillTypes.js';

type FillValueResult = { success: true; value: string | number } | { success: false };

const sanitizeText = (text: string) => text.replace(/[\n\r]+/g, ' ');

const tryParseLocalizedDate = (rawText: string, languages: string[]) => {
  for (const lang of languages) {
    const timestamp = parseLocalizedDate(rawText, lang);
    if (timestamp !== null) {
      return timestamp;
    }
  }
  return null;
};

const coerceDateViaApi = async (
  rawText: string,
  entityLanguage: string,
  documentLanguage?: string
): Promise<FillValueResult> => {
  const fromEntity = await coerceValue(rawText, 'date', entityLanguage);
  if (fromEntity?.success) {
    return { success: true, value: fromEntity.value };
  }
  if (!documentLanguage || documentLanguage === entityLanguage) {
    return { success: false };
  }
  const fromDocument = await coerceValue(rawText, 'date', documentLanguage);
  return fromDocument?.success ? { success: true, value: fromDocument.value } : { success: false };
};

const coerceDateFromText = async (
  rawText: string,
  entityLanguage: string,
  documentLanguage?: string
): Promise<FillValueResult> => {
  const parseLanguages =
    documentLanguage && documentLanguage !== entityLanguage
      ? [entityLanguage, documentLanguage]
      : [entityLanguage];
  const timestamp = tryParseLocalizedDate(rawText, parseLanguages);
  if (timestamp !== null) {
    return { success: true, value: timestamp };
  }
  return coerceDateViaApi(rawText, entityLanguage, documentLanguage);
};

const resolveFillValue = async (
  coerceType: PdfFillCoerceType,
  rawText: string,
  entityLanguage: string,
  documentLanguage?: string
): Promise<FillValueResult> => {
  if (coerceType === 'text') {
    return { success: true, value: sanitizeText(rawText) };
  }
  if (coerceType === 'date') {
    return coerceDateFromText(rawText, entityLanguage, documentLanguage);
  }
  const coerced = await coerceValue(rawText.trim(), 'numeric', entityLanguage);
  return coerced?.success ? { success: true, value: coerced.value } : { success: false };
};

export { resolveFillValue };
