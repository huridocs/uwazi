import { t } from '#app/I18N/index.js';
import { availableLanguages, formatLanguageName } from '#shared/language/index.js';

type FoldStep = 0 | 1 | 2 | 3;

const languageLabel = (key: string) =>
  availableLanguages.find(language => language.key === key)?.localized_label ||
  formatLanguageName(key, key);

const languageDir = (key: string) =>
  availableLanguages.find(language => language.key === key)?.rtl ? 'rtl' : 'ltr';

const foldStep = ({
  availW,
  w0,
  w1,
  w2,
}: {
  availW: number;
  w0: number;
  w1: number;
  w2: number;
}): FoldStep => {
  if (availW === 0 || (w0 > 0 && w0 <= availW + 0.5)) return 0;
  if (w1 > 0 && w1 <= availW + 0.5) return 1;
  if (w2 > 0 && w2 <= availW + 0.5) return 2;
  return 3;
};

const writeSourceFirstHint = (current: string, label: string) =>
  t('System', `Write the ${languageLabel(current)} ${label.toLowerCase()} first`, null, false);

const translateHint = ({
  source,
  current,
  label,
  empties,
}: {
  source: string;
  current: string;
  label: string;
  empties: string[];
}) => {
  if (!source) return writeSourceFirstHint(current, label);
  if (empties.length === 0) {
    return t(
      'System',
      'Every language has a value — use the re-translate button on a row',
      null,
      false
    );
  }
  return t(
    'System',
    `Fill ${empties.map(languageLabel).join(', ')} from ${languageLabel(current)}`,
    null,
    false
  );
};

const languageRowSummary = ({
  languages,
  current,
  values,
  working,
  onTranslate,
  label,
  serviceAvailable = true,
}: {
  languages: string[];
  current: string;
  values: Record<string, string>;
  working: string[];
  onTranslate?: (language: string) => Promise<string>;
  label: string;
  serviceAvailable?: boolean;
}) => {
  const others = languages.filter(language => language !== current);
  const source = values[current]?.trim() ?? '';
  const empties = others.filter(language => !values[language]?.trim());
  const setText = t('System', `${others.length} other languages set`, null, false);
  const emptyText = t(
    'System',
    `${empties.length} of ${others.length} other languages empty`,
    null,
    false
  );
  return {
    others,
    source,
    empties,
    canTranslate:
      Boolean(onTranslate) &&
      serviceAvailable &&
      source.length > 0 &&
      empties.length > 0 &&
      working.length === 0,
    setText,
    emptyText,
    summary: empties.length === 0 ? setText : emptyText,
    translateTitle: serviceAvailable
      ? translateHint({ source, current, label, empties })
      : t('System', 'Translation service is unavailable', null, false),
  };
};

export { foldStep, languageDir, languageLabel, languageRowSummary, writeSourceFirstHint };
export type { FoldStep };
