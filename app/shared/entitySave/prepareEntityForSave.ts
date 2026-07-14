import { mapMediaMetadataForSave } from './mediaMetadata.js';
import type { EntityWithSaveMetadata, MediaPropertyContext } from './types.js';

const prepareEntityForSave = <T extends EntityWithSaveMetadata>(
  entity: T,
  mediaContext?: MediaPropertyContext
): T => {
  if (!mediaContext || mediaContext.names.size === 0) {
    return entity;
  }

  return mapMediaMetadataForSave(entity, mediaContext.names, mediaContext.types);
};

export { prepareEntityForSave };
