import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntitySaveMetadata, EntityWithSaveMetadata, MediaPropertyType } from './types.js';

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

  const [, , timeLinks] = timelinkMatch;
  const id = parseMediaSourceUrl(rawValue);
  if (!isUploadId(id)) {
    return { value: rawValue };
  }

  const { index } = findPendingByFileLocalId(attachments, id);
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

type MediaMapContext = {
  attachments: ReadonlyArray<AttachmentLike>;
  names: ReadonlySet<string>;
  types: ReadonlyMap<string, MediaPropertyType>;
};

const mapMediaField = (
  name: string,
  values: MetadataObjectSchema[] | undefined,
  ctx: MediaMapContext
): MetadataObjectSchema[] | undefined => {
  if (!values?.length || !ctx.names.has(name)) return values;
  const propertyType = ctx.types.get(name);
  const [existing] = values;
  const rawValue = existing?.value;
  if (!propertyType || typeof rawValue !== 'string') return values;
  if (
    rawValue === '' &&
    (typeof existing.attachment === 'number' || typeof existing.timeLinks === 'string')
  ) {
    return values;
  }
  return [mapMediaValue(rawValue, ctx.attachments, propertyType)];
};

const mapMediaBag = (bag: EntitySaveMetadata, ctx: MediaMapContext): EntitySaveMetadata =>
  Object.fromEntries(
    Object.entries(bag).map(([name, values]) => [name, mapMediaField(name, values, ctx)])
  );

const mapMediaMetadataForSave = <T extends EntityWithSaveMetadata>(
  entity: T,
  mediaPropertyNames: ReadonlySet<string>,
  mediaPropertyTypes: ReadonlyMap<string, MediaPropertyType>
): T => {
  if (mediaPropertyNames.size === 0) return entity;
  const ctx: MediaMapContext = {
    attachments: entity.attachments ?? [],
    names: mediaPropertyNames,
    types: mediaPropertyTypes,
  };
  return {
    ...entity,
    ...(entity.metadata ? { metadata: mapMediaBag(entity.metadata, ctx) } : {}),
    ...(entity.translations
      ? {
          translations: Object.fromEntries(
            Object.entries(entity.translations).map(([language, bag]) => [
              language,
              mapMediaBag(bag, ctx),
            ])
          ),
        }
      : {}),
  };
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
