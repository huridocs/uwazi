import { DateTime } from 'luxon';
import { t } from '#app/I18N/index.js';
import { LanguageUtils } from '#shared/language/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { formatEntityFiles, getMainDocument } from '#V2/formatters/index.js';
import { ClientTemplateSchema } from '#V2/shared/types.js';
import { formatBytes, getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { EntityFileRow, EntityFileForView, FileKind } from './types.js';

const KIND_SYSTEM_KEY: Record<FileKind, string> = {
  pdf: 'PDF',
  audio: 'Audio',
  video: 'Video',
  image: 'Image',
  link: 'Link',
  document: 'Document',
};

const resolveFileKind = (file: EntityFileForView): FileKind => {
  if (file.fileType === 'externalURL') return 'link';
  const mimeType =
    file.mimetype || getMimetypeFromUrl(file.url || file.filename || file.originalname || '');
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('image/') || file.fileType === 'image') return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'document';
};

const getTypeLabel = (kind: FileKind) => t('System', KIND_SYSTEM_KEY[kind], null, false);

const getLanguageLabel = (language?: string) => {
  if (!language) {
    return '—';
  }

  return (LanguageUtils.fromISO639_3(language, false)?.ISO639_1 || language).toUpperCase();
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
    const entityFile: EntityFileForView = {
      ...file,
      _id: file._id ? String(file._id) : undefined,
      fileType: file.fileType,
    };
    const rowId = entityFile._id || entityFile.filename || entityFile.url || `entity-file-${index}`;
    const modifiedTimestamp = entityFile.creationDate;
    const category =
      entityFile.fileType === 'mainDocument' || entityFile.fileType === 'document'
        ? 'primary'
        : 'supporting';

    const kind = resolveFileKind(entityFile);

    return {
      rowId,
      displayName:
        entityFile.originalname ||
        entityFile.url ||
        entityFile.filename ||
        t('System', 'Untitled', null, false),
      kind,
      typeLabel: getTypeLabel(kind),
      sizeLabel: entityFile.size ? formatBytes(entityFile.size) : '—',
      languageKey: getLanguageLabel(entityFile.language),
      modifiedLabel: formatFileDate(modifiedTimestamp, locale),
      modifiedTimestamp,
      category,
      fileType: entityFile.fileType,
      status: entityFile.status,
      raw: entityFile,
    };
  });

  return {
    mainDocumentId: mainDocument?._id ? String(mainDocument._id) : undefined,
    primaryRows: rows.filter(row => row.category === 'primary'),
    supportingRows: rows.filter(row => row.category === 'supporting'),
  };
};

export { buildEntityFileRows };
