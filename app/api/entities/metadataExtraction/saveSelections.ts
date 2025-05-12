import { files } from 'api/files';
import { IXSelectionsModel } from 'api/suggestions/IXSelectionsModel';
import { uniqBy } from 'lodash';
import { ExtractedMetadataSchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { validateIxSelection } from 'shared/types/ixSelectionSchema';
import entities from '../entities';

interface ExtractedMetadataSource {
  type: 'file' | 'entity_property';
  id?: string;
  propertyName?: string;
}

interface EntityWithExtractedMetadata extends EntitySchema {
  __extractedMetadata?: {
    source: ExtractedMetadataSource;
    selections: ExtractedMetadataSchema[];
  };
}

const mergeUniqueSelections = (
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
    selections = mergeUniqueSelections(selections, file.extractedMetadata).filter(
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
  if (!entity.__extractedMetadata?.source?.id) {
    return null;
  }

  if (entity.__extractedMetadata.source.type === 'entity_property') {
    const originalEntity = await entities.getById(entity._id);
    if (!originalEntity) {
      throw new Error(`Entity with ID ${entity._id} not found`);
    }
    const ixSelection: any = {
      ...entity.__extractedMetadata,
      source: {
        type: 'entity_property',
        id: entity.__extractedMetadata.source.id,
        propertyName: entity.__extractedMetadata.source.propertyName,
      },
      language: originalEntity.language,
    };
    validateIxSelection(ixSelection);
    return IXSelectionsModel.save(ixSelection);
  }

  const [mainDocument] = await files.get({
    _id: entity.__extractedMetadata.source.id,
  });

  if (mainDocument) {
    const selections = prepareSelections(entity, mainDocument);

    if (selectionsHaveChanged(mainDocument.extractedMetadata || [], selections)) {
      return files.save({ _id: mainDocument._id, extractedMetadata: selections });
    }
  }

  return null;
};

export { saveSelections };
