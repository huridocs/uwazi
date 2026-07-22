export {
  readFileAsBase64,
  constructFile,
  prepareHTMLMediaView,
  revokeHTMLMediaView,
  revokeHTMLMediaViewUrl,
  isSerializedFile,
} from '../fileUploadUtils.js';
export {
  extractUploadIdFromMediaValue,
  filterReferencedPendingAttachments,
  findFileLocalIdAttachmentIndex,
  findUploadedAttachmentIndex,
  isUploadId,
  mapMediaMetadataForSave,
  mapMediaValue,
  resolveMetadataAttachmentIndex,
} from './mediaMetadata.js';
export { mediaContextFromProperties, mediaContextFromTemplate } from './mediaContext.js';
export { prepareEntityForSave } from './prepareEntityForSave.js';
export {
  prepareMetadataAndFiles,
  registerMediaAttachment,
  wrapEntityMetadata,
} from './legacyMetadata.js';
export { resolveMediaDisplayUrl } from './resolveMediaDisplayUrl.js';
export type {
  EntitySaveMetadata,
  EntityWithSaveMetadata,
  MediaPropertyContext,
  MediaPropertyType,
  TemplateProperty,
} from './types.js';
