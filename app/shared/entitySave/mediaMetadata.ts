import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityWithSaveMetadata, MediaPropertyType } from './types.js';

const UPLOAD_ID_PATTERN = /^[a-zA-Z\d_]+$/;

const isUploadId = (value: string) => UPLOAD_ID_PATTERN.test(value);

const parseMediaSourceUrl = (value: string): string => {
  if (!value.startsWith('(')) {
    return value;
  }

  return value.match(/^\(([^,]+),/)?.[1]?.trim() || value;
};

type AttachmentLike = {
  fileLocalID?: string;
  serializedFile?: string;
  timeLinks?: string;
};

const isUploadedAttachment = (
  file: AttachmentLike
): file is AttachmentLike & { serializedFile: string } => typeof file.serializedFile === 'string';

const pendingUploadAttachments = (attachments: ReadonlyArray<AttachmentLike>) => {
  const uploaded = attachments.filter(isUploadedAttachment);
  return uploaded.length > 0 ? uploaded : attachments.filter(file => Boolean(file.fileLocalID));
};

const findPendingByFileLocalId = (
  attachments: ReadonlyArray<AttachmentLike>,
  fileLocalID: string
) => {
  const pending = pendingUploadAttachments(attachments);
  return { pending, index: pending.findIndex(file => file.fileLocalID === fileLocalID) };
};

const mapTimelinkValue = (
  rawValue: string,
  attachments: ReadonlyArray<AttachmentLike>
): MetadataObjectSchema => {
  const timelinkMatch = rawValue.match(/^\(([^,]+),\s*({.*})\)$/);
  if (!timelinkMatch) {
    return { value: rawValue };
  }

  const [, id, timeLinks] = timelinkMatch;
  const trimmedId = id.trim();
  if (!isUploadId(trimmedId)) {
    return { value: rawValue };
  }

  const { index } = findPendingByFileLocalId(attachments, trimmedId);
  return index >= 0 ? { value: '', attachment: index, timeLinks } : { value: rawValue };
};

const mapUploadIdValue = (
  uploadId: string,
  attachments: ReadonlyArray<AttachmentLike>
): MetadataObjectSchema => {
  const { pending, index } = findPendingByFileLocalId(attachments, uploadId);
  if (index < 0) {
    return { value: uploadId };
  }
  const timeLinks = pending[index]?.timeLinks;
  return { value: '', attachment: index, ...(timeLinks ? { timeLinks } : {}) };
};

const extractUploadIdFromMediaValue = (rawValue: string): string | undefined => {
  if (
    !rawValue ||
    rawValue.startsWith('blob:') ||
    rawValue.startsWith('http') ||
    rawValue.startsWith('/')
  ) {
    return undefined;
  }
  if (rawValue.startsWith('(')) {
    const id = parseMediaSourceUrl(rawValue);
    return isUploadId(id) ? id : undefined;
  }
  return isUploadId(rawValue) ? rawValue : undefined;
};

type MediaMetadataBag = Record<string, ReadonlyArray<{ value?: unknown }> | undefined> | undefined;

const currentAndTranslationMetadata = (
  current: MediaMetadataBag,
  translations?: Record<string, MediaMetadataBag>
): MediaMetadataBag[] => [current, ...Object.values(translations ?? {})];

const filterReferencedPendingAttachments = <T extends AttachmentLike>(
  pending: ReadonlyArray<T>,
  metadataBags: ReadonlyArray<MediaMetadataBag>,
  mediaPropertyNames: ReadonlySet<string>
): T[] => {
  const referenced = new Set<string>();
  for (const metadata of metadataBags) {
    for (const name of mediaPropertyNames) {
      const rawValue = metadata?.[name]?.[0]?.value;
      if (typeof rawValue === 'string') {
        const uploadId = extractUploadIdFromMediaValue(rawValue);
        if (uploadId) referenced.add(uploadId);
      }
    }
  }
  return pending.filter(
    (attachment): attachment is T & { fileLocalID: string } =>
      typeof attachment.fileLocalID === 'string' && referenced.has(attachment.fileLocalID)
  );
};

const mapMediaValue = (
  rawValue: string,
  attachments: ReadonlyArray<AttachmentLike>,
  propertyType: MediaPropertyType
): MetadataObjectSchema => {
  if (rawValue.startsWith('blob:')) {
    return { value: '' };
  }
  if (propertyType === 'media' && rawValue.startsWith('(')) {
    return mapTimelinkValue(rawValue, attachments);
  }
  if (isUploadId(rawValue)) {
    return mapUploadIdValue(rawValue, attachments);
  }
  return { value: rawValue };
};

const mapMediaMetadataForSave = <T extends EntityWithSaveMetadata>(
  entity: T,
  mediaPropertyNames: ReadonlySet<string>,
  mediaPropertyTypes: ReadonlyMap<string, MediaPropertyType>
): T => {
  if (!entity.metadata || mediaPropertyNames.size === 0) {
    return entity;
  }

  const attachments = entity.attachments ?? [];
  const metadata = Object.fromEntries(
    Object.entries(entity.metadata).map(([name, values]) => {
      if (!values?.length || !mediaPropertyNames.has(name)) {
        return [name, values];
      }
      const propertyType = mediaPropertyTypes.get(name);
      const [existing] = values;
      const rawValue = existing?.value;
      if (!propertyType || typeof rawValue !== 'string') {
        return [name, values];
      }
      if (
        rawValue === '' &&
        (typeof existing.attachment === 'number' || typeof existing.timeLinks === 'string')
      ) {
        return [name, values];
      }
      return [name, [mapMediaValue(rawValue, attachments, propertyType)]];
    })
  ) as T['metadata'];

  return { ...entity, metadata };
};

export {
  currentAndTranslationMetadata,
  extractUploadIdFromMediaValue,
  filterReferencedPendingAttachments,
  isUploadId,
  mapMediaMetadataForSave,
  mapMediaValue,
  parseMediaSourceUrl,
};
