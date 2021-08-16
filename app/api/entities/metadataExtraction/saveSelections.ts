import { files } from 'api/files';
import { uniqBy } from 'lodash';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';

interface EntityWithExtractedMetadata extends EntitySchema {
  __extractedMetadata: { selections: ExtractedMetadataSchema[] };
}

const checkSelections = (entity: EntityWithExtractedMetadata, file: FileType) => {
  let selections: any;

  const entityData = {
    title: entity.title,
    ...entity.metadata,
  };

  if (file.extractedMetadata && entity.__extractedMetadata) {
    const merged = entity.__extractedMetadata.selections.concat(file.extractedMetadata);
    selections = uniqBy(merged, 'label');
    return selections;
  }

  if (entity.__extractedMetadata) {
    selections = entity.__extractedMetadata.selections;
    return selections;
  }

  return [];
};

const saveSelections = async (entity: EntityWithExtractedMetadata) => {
  const mainDocument = await files.get({ entity: entity.sharedId, type: 'document' });
  let selections = [];

  if (mainDocument.length > 0) {
    selections = checkSelections(entity, mainDocument[0]);
  }

  if (selections.length > 0) {
    return files.save({ _id: mainDocument[0]._id, extractedMetadata: selections });
  }

  return null;
};

export { saveSelections };
