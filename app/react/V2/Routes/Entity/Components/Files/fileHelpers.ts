import { t } from '#app/I18N/index.js';
import {
  availableLanguages,
  formatLanguageOptionLabel,
  LanguageUtils,
} from '#shared/language/index.js';
import { OptionSchema } from '#V2/Components/Forms/index.js';
import type { EntityFileRow } from './types.js';

type FileLike = Pick<File, 'type' | 'name'>;

const isFileRowSelectable = (row: Pick<EntityFileRow, 'status'>) => row.status !== 'processing';

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

const fileLanguageSelectOptions = (uiLocale: string): OptionSchema[] => {
  const locale = uiLocale || 'en';
  return [
    ...availableLanguages
      .map(item => ({
        key: item.ISO639_3,
        value: item.ISO639_3,
        label: formatLanguageOptionLabel(item.ISO639_1, locale),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, locale)),
    { key: 'other', value: 'other', label: t('System', 'other', 'other', false) },
  ];
};

const resolveFileLanguage = (rawLanguage?: string) => {
  if (!rawLanguage || rawLanguage === 'other') return 'other';
  return LanguageUtils.fromISO639_3(rawLanguage, false)?.ISO639_3 ?? 'other';
};

export {
  isFileRowSelectable,
  isPdfFile,
  fileSupportsLanguage,
  fileLanguageSelectOptions,
  resolveFileLanguage,
};
