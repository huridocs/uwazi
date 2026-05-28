import { DateTime } from 'luxon';
import { t } from '#app/I18N/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { formatEntityFiles, getMainDocument } from '#V2/formatters/index.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { formatBytes, getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { EntityFileRow, EntityFileForView } from './types.js';

const getTypeLabel = (file: EntityFileForView) => {
  if (file.fileType === 'externalURL') {
    return 'Link';
  }

  const mimeType = file.mimetype || getMimetypeFromUrl(file.url || '');
  if (mimeType) {
    return mimeType.split('/').at(-1)?.toUpperCase() || '';
  }

  return file.fileType === 'document'
    ? t('System', 'Document', null, false)
    : t('System', 'Attachment', null, false);
};

const formatFileDate = (timestamp?: number, locale?: string) => {
  if (!timestamp) {
    return '—';
  }

  const normalized = timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;
  const asDate = DateTime.fromSeconds(normalized, { zone: 'utc' }).setLocale(locale || 'en');
  return asDate.isValid ? asDate.toLocaleString(DateTime.DATE_MED) : '—';
};

const buildEntityFileRows = (
  entity: Entity,
  templates: ClientTemplateSchema[],
  locale: string,
  defaultLanguage?: string
) => {
  const mainDocument = getMainDocument(entity.documents, locale, defaultLanguage);
  const files = formatEntityFiles(entity, templates, locale, defaultLanguage).map(
    ({ file, fileType }) => ({ ...file, fileType })
  );

  const rows = files.map((file, index): EntityFileRow => {
    const rowId = file._id || file.filename || file.url || `entity-file-${index}`;
    const modifiedTimestamp = file.creationDate || file.timestamp || file.editDate;
    const category = file.fileType === 'mainDocument' || file.fileType === 'document' ? 'primary' : 'supporting';

    return {
      rowId,
      displayName: file.originalname || file.url || file.filename || t('System', 'Untitled', null, false),
      typeLabel: getTypeLabel(file),
      sizeLabel: file.size ? formatBytes(file.size) : '—',
      languageKey: file.language?.toUpperCase() || '—',
      modifiedLabel: formatFileDate(modifiedTimestamp, locale),
      modifiedTimestamp,
      isActiveMain: Boolean(mainDocument?._id) && mainDocument?._id === file._id,
      category,
      fileType: file.fileType,
      raw: file,
    };
  });

  return {
    mainDocumentId: mainDocument?._id,
    primaryRows: rows.filter(row => row.category === 'primary'),
    supportingRows: rows.filter(row => row.category === 'supporting'),
  };
};

export { buildEntityFileRows };
