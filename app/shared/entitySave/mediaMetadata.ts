import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntityWithSaveMetadata, MediaPropertyType } from './types.js';

const UPLOAD_ID_PATTERN = /^[a-zA-Z\d_]+$/;

const isUploadId = (value: string) => UPLOAD_ID_PATTERN.test(value);

type AttachmentLike = {
  fileLocalID?: string;
  serializedFile?: string;
};

const isUploadedAttachment = (
  file: AttachmentLike
): file is AttachmentLike & { serializedFile: string } => typeof file.serializedFile === 'string';

const findUploadedAttachmentIndex = (
  attachments: ReadonlyArray<AttachmentLike>,
  matches: (file: AttachmentLike) => boolean
): number => attachments.filter(isUploadedAttachment).findIndex(matches);

const findFileLocalIdAttachmentIndex = (
  attachments: ReadonlyArray<AttachmentLike>,
  fileLocalID: string
): number =>
  attachments
    .filter(file => Boolean(file.fileLocalID))
    .findIndex(file => file.fileLocalID === fileLocalID);

const resolveMetadataAttachmentIndex = (
  attachments: ReadonlyArray<AttachmentLike>,
  fileLocalID: string
): number => findUploadedAttachmentIndex(attachments, file => file.fileLocalID === fileLocalID);

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

  const attachmentIndex = resolveMetadataAttachmentIndex(attachments, trimmedId);
  return attachmentIndex >= 0
    ? { value: '', attachment: attachmentIndex, timeLinks }
    : { value: rawValue };
};

const mapUploadIdValue = (
  uploadId: string,
  attachments: ReadonlyArray<AttachmentLike>
): MetadataObjectSchema => {
  const attachmentIndex = resolveMetadataAttachmentIndex(attachments, uploadId);
  return attachmentIndex >= 0 ? { value: '', attachment: attachmentIndex } : { value: uploadId };
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
    const id = rawValue.match(/^\(([^,]+),/)?.[1]?.trim();
    return id && isUploadId(id) ? id : undefined;
  }
  return isUploadId(rawValue) ? rawValue : undefined;
};

const filterReferencedPendingAttachments = <T extends AttachmentLike>(
  pending: ReadonlyArray<T>,
  metadata: EntityWithSaveMetadata['metadata'],
  mediaPropertyNames: ReadonlySet<string>
): T[] => {
  const referenced = new Set<string>();
  mediaPropertyNames.forEach(name => {
    const rawValue = metadata?.[name]?.[0]?.value;
    if (typeof rawValue !== 'string') {
      return;
    }
    const uploadId = extractUploadIdFromMediaValue(rawValue);
    if (uploadId) {
      referenced.add(uploadId);
    }
  });
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
      const existing = values[0];
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
  extractUploadIdFromMediaValue,
  filterReferencedPendingAttachments,
  findFileLocalIdAttachmentIndex,
  findUploadedAttachmentIndex,
  isUploadId,
  mapMediaMetadataForSave,
  mapMediaValue,
  resolveMetadataAttachmentIndex,
};
