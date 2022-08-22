import { files } from 'api/files';
import { uniqBy } from 'lodash';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';

interface EntityWithExtractedMetadata extends EntitySchema {
  __extractedMetadata?: { fileID: string; selections: ExtractedMetadataSchema[] };
}

const updateSelections = (
  newSelections: ExtractedMetadataSchema[],
  storedSelections: ExtractedMetadataSchema[]
) => {
  const merged = newSelections.concat(storedSelections);
  const selections = uniqBy(merged, 'name');
  return selections;
};

const prepareSelections = (entity: EntityWithExtractedMetadata, file: FileType) => {
  let selections = entity.__extractedMetadata?.selections || [];

  if (file.extractedMetadata) {
    selections = updateSelections(selections, file.extractedMetadata).filter(
      selection => !selection.deleteSelection
    );
  }

  return selections;
};

const selectionsHaveChanged = (
  fileExtractedMetadata: ExtractedMetadataSchema[],
  selections: ExtractedMetadataSchema[]
) => {
  if (fileExtractedMetadata.length === selections.length) {
    const hasChanges = fileExtractedMetadata.filter(
      (extractedData, index) => extractedData.selection?.text !== selections[index].selection?.text
    );
    return hasChanges.length > 0;
  }
  return true;
};

const saveSelections = async (entity: EntityWithExtractedMetadata) => {
  let mainDocument: FileType[] = [];

  if (entity.__extractedMetadata?.fileID) {
    mainDocument = await files.get({
      _id: entity.__extractedMetadata.fileID,
    });
  }

  if (mainDocument.length > 0) {
    const selections = prepareSelections(entity, mainDocument[0]);

    if (selectionsHaveChanged(mainDocument[0].extractedMetadata || [], selections)) {
      return files.save({ _id: mainDocument[0]._id, extractedMetadata: selections });
    }
  }

  return null;
};

export { saveSelections };
