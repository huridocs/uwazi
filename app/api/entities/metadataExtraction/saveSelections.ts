import { files } from 'api/files';
import { uniqBy } from 'lodash';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { textSimilarityCheck } from './textSimilarityCheck';

interface EntityWithExtractedMetadata extends EntitySchema {
  __extractedMetadata: { selections: ExtractedMetadataSchema[] };
}

const updateSelections = (newSelections: any[], storedSelections: any[]) => {
  const merged = newSelections.concat(storedSelections);
  const selections = uniqBy(merged, 'name');
  return selections;
};

const removeUserChangedSelections = (
  entityData: { [key: string]: any },
  userSelections?: any[]
) => {
  let updatedSelections = [];
  if (userSelections) {
    updatedSelections = userSelections.filter(selection => {
      if (selection.name === 'title') {
        return textSimilarityCheck(selection.selection.text, entityData.title);
      }
      return textSimilarityCheck(selection.selection.text, entityData[selection.name][0].value);
    });
  }
  return updatedSelections;
};

const checkSelections = (entity: EntityWithExtractedMetadata, file: FileType) => {
  let selections = entity.__extractedMetadata?.selections || [];
  const entityData = {
    title: entity.title,
    ...entity.metadata,
  };

  if (file.extractedMetadata) {
    selections = updateSelections(selections, file.extractedMetadata);
  }

  selections = removeUserChangedSelections(entityData, selections);

  return selections;
};

const saveSelections = async (entity: EntityWithExtractedMetadata) => {
  const mainDocument = await files.get({ entity: entity.sharedId, type: 'document' });

  console.log(JSON.stringify(entity, null, 2));

  if (mainDocument.length > 0) {
    const selections = checkSelections(entity, mainDocument[0]);
    if (selections.length > 0) {
      return files.save({ _id: mainDocument[0]._id, extractedMetadata: selections });
    }
  }

  return null;
};

export { saveSelections };
