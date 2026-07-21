import uniqBy from 'lodash/uniqBy.js';
import { files } from '#api/files/index.js';
import { PropertySelectionSchema } from '#shared/types/commonTypes.js';
import { EntitySchema } from '#shared/types/entityType.js';
import { FileType } from '#shared/types/fileType.js';

interface EntityWithPropertySelections extends EntitySchema {
  propertySelections?: { fileID: string; selections: PropertySelectionSchema[] };
}

const updateSelections = (
  newSelections: PropertySelectionSchema[],
  storedSelections: PropertySelectionSchema[]
) => {
  const merged = newSelections.concat(storedSelections);
  const selections = uniqBy(merged, 'name');
  return selections;
};

const prepareSelections = (entity: EntityWithPropertySelections, file: FileType) => {
  let selections = entity.propertySelections?.selections || [];

  if (file.propertySelections) {
    selections = updateSelections(selections, file.propertySelections).filter(
      selection => !selection.deleteSelection
    );
  }

  return selections;
};

const selectionsHaveChanged = (
  filePropertySelections: PropertySelectionSchema[],
  selections: PropertySelectionSchema[]
) => {
  if (filePropertySelections.length === selections.length) {
    const hasChanges = filePropertySelections.filter(
      (extractedData, index) => extractedData.selection?.text !== selections[index].selection?.text
    );
    return hasChanges.length > 0;
  }
  return true;
};

const savePropertySelections = async (entity: EntityWithPropertySelections) => {
  let mainDocument: FileType[] = [];

  if (entity.propertySelections?.fileID) {
    mainDocument = await files.get({
      _id: entity.propertySelections.fileID,
    });
  }

  if (mainDocument.length > 0) {
    const selections = prepareSelections(entity, mainDocument[0]);

    if (selectionsHaveChanged(mainDocument[0].propertySelections || [], selections)) {
      return files.save({ _id: mainDocument[0]._id, propertySelections: selections });
    }
  }

  return null;
};

export { savePropertySelections };
