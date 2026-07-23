import { t } from '#app/I18N/index.js';
import { availableLanguages } from '#shared/language/index.js';
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

const fileLanguageSelectOptions = (): OptionSchema[] => [
  ...availableLanguages.map(item => ({
    key: item.ISO639_3,
    value: item.ISO639_3,
    label: `${item.localized_label} (${item.label})`,
  })),
  { key: 'other', value: 'other', label: t('System', 'other', 'other', false) },
];

export { isFileRowSelectable, isPdfFile, fileSupportsLanguage, fileLanguageSelectOptions };
