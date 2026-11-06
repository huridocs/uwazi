import { t } from '#app/I18N/index.js';
import { availableLanguages, formatLanguageName, LanguageUtils } from '#shared/language/index.js';
import type { LanguageSelectOption } from '#V2/Components/UI/index.js';
import type { EntityFileRow } from './types.js';

type FileLike = Pick<File, 'type' | 'name'>;

const isFileRowSelectable = (row: Pick<EntityFileRow, 'status'>) => row.status !== 'processing';

const extensionSuffix = /\.[A-Za-z0-9]{1,5}$/;

const fileShownName = (row: EntityFileRow) =>
  row.kind === 'link' ? row.displayName : row.displayName.replace(extensionSuffix, '');

const fileFactsLine = (row: EntityFileRow, includeLanguage = true) =>
  [row.typeLabel, row.sizeLabel, includeLanguage ? row.languageKey : '']
    .map(value => value.trim())
    .filter(value => value !== '' && value !== '—')
    .join(' · ');

const fileQueueKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const isPdfFile = (file: FileLike) =>
  file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

const fileSupportsLanguage = (file: FileLike) => {
  const mime = file.type;

  if (mime.startsWith('image/') || mime.startsWith('audio/') || mime.startsWith('video/')) {
    return false;
  }

  if (
    mime === 'application/pdf' ||
    mime.startsWith('text/') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('presentation') ||
    mime.includes('spreadsheet')
  ) {
    return true;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  return ['pdf', 'doc', 'docx', 'txt', 'odt', 'rtf'].includes(extension ?? '');
};

const fileRowShowsLanguage = (row: Pick<EntityFileRow, 'category' | 'displayName' | 'raw'>) =>
  row.category === 'primary' &&
  fileSupportsLanguage({
    type: row.raw.mimetype || '',
    name: row.raw.originalname || row.displayName,
  });

const fileLanguageOptionsByLocale = new Map<string, LanguageSelectOption[]>();

const fileLanguageSelectOptions = (uiLocale: string): LanguageSelectOption[] => {
  const locale = uiLocale || 'en';
  const cached = fileLanguageOptionsByLocale.get(locale);
  if (cached) {
    return cached;
  }
  const options = [
    ...availableLanguages
      .map(item => ({
        value: item.ISO639_3,
        label: formatLanguageName(item.ISO639_1, locale),
        iso6391: item.ISO639_1,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale)),
    { value: 'other', label: t('System', 'other', 'other', false) },
  ];
  fileLanguageOptionsByLocale.set(locale, options);
  return options;
};

const resolveFileLanguage = (rawLanguage?: string) => {
  if (!rawLanguage || rawLanguage === 'other') return 'other';
  return LanguageUtils.fromISO639_3(rawLanguage, false)?.ISO639_3 ?? 'other';
};

export {
  fileFactsLine,
  fileQueueKey,
  fileShownName,
  isFileRowSelectable,
  isPdfFile,
  fileRowShowsLanguage,
  fileSupportsLanguage,
  fileLanguageSelectOptions,
  resolveFileLanguage,
};
