import type { ClientFile } from '#app/istore.js';
import type { MetadataObjectSchema } from '#shared/types/commonTypes.js';
import type { EntitySaveInput } from '#V2/services/contracts/EntitiesService.js';

const UPLOAD_ID_PATTERN = /^[a-zA-Z\d_]+$/;

const isUploadId = (value: string) => UPLOAD_ID_PATTERN.test(value);

const isUploadedAttachment = (file: ClientFile): file is ClientFile & { serializedFile: string } =>
  typeof file.serializedFile === 'string';

const findUploadedAttachmentIndex = (
  attachments: ClientFile[],
  matches: (file: ClientFile) => boolean
): number => {
  let uploadIndex = -1;

  for (const file of attachments) {
    if (!isUploadedAttachment(file)) {
      continue;
    }

    uploadIndex += 1;
    if (matches(file)) {
      return uploadIndex;
    }
  }

  return -1;
};

const mapMediaValue = (
  rawValue: string,
  attachments: ClientFile[],
  propertyType: 'image' | 'media'
): MetadataObjectSchema => {
  if (rawValue.startsWith('blob:')) {
    return { value: '' };
  }

  if (propertyType === 'media') {
    const timelinkMatch = rawValue.match(/^\(([^,]+),\s*({.*})\)$/);
    if (timelinkMatch) {
      const [, id, timeLinks] = timelinkMatch;
      const trimmedId = id.trim();
      if (isUploadId(trimmedId)) {
        const attachmentIndex = findUploadedAttachmentIndex(
          attachments,
          file => file.fileLocalID === trimmedId
        );
        if (attachmentIndex >= 0) {
          return { value: '', attachment: attachmentIndex, timeLinks };
        }
      }
      return { value: rawValue };
    }
  }

  if (isUploadId(rawValue)) {
    const attachmentIndex = findUploadedAttachmentIndex(
      attachments,
      file => file.fileLocalID === rawValue
    );
    if (attachmentIndex >= 0) {
      return { value: '', attachment: attachmentIndex };
    }
    return { value: '' };
  }

  return { value: rawValue };
};

const mapMediaMetadataForSave = (
  entity: EntitySaveInput,
  mediaPropertyNames: ReadonlySet<string>,
  mediaPropertyTypes: ReadonlyMap<string, 'image' | 'media'>
): EntitySaveInput => {
  if (!entity.metadata || mediaPropertyNames.size === 0) {
    return entity;
  }

  const attachments = (entity.attachments ?? []) as ClientFile[];
  const metadata = Object.fromEntries(
    Object.entries(entity.metadata).map(([name, values]) => {
      if (!values?.length || !mediaPropertyNames.has(name)) {
        return [name, values];
      }

      const propertyType = mediaPropertyTypes.get(name);
      if (!propertyType) {
        return [name, values];
      }

      const rawValue = values[0]?.value;
      if (typeof rawValue !== 'string') {
        return [name, values];
      }

      return [name, [mapMediaValue(rawValue, attachments, propertyType)]];
    })
  ) as EntitySaveInput['metadata'];

  return { ...entity, metadata };
};

export { mapMediaMetadataForSave, isUploadId };
