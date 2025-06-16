import { EnforcedWithId } from 'api/odm';
import templatesModel from 'api/templates/templatesModel';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { EntitySchema } from 'shared/types/entityType';
import { FileType } from 'shared/types/fileType';
import { propertyIsMultiValued } from 'shared/getIXSuggestionState';
import ixmodels from './ixmodels';

type GetTargetPropertyInput = {
  extractor: EnforcedWithId<IXExtractorType>;
};

type ExtractCurrentValueInput = {
  entity: Partial<EntitySchema>;
  targetProperty: PropertySchema;
};

type ExtractLabelTextForPDFInput = {
  file: EnforcedWithId<FileType>;
  targetProperty: PropertySchema;
};

type ExtractLabeledValueFromEntityInput = {
  entity: Partial<EntitySchema>;
  targetProperty: PropertySchema;
};

export class IXServices {
  static async getTargetProperty({ extractor }: GetTargetPropertyInput) {
    const template = await templatesModel.getById(extractor.templates[0]);
    const property =
      extractor.property === 'title'
        ? template?.commonProperties?.find(p => p.name === extractor.property)
        : template?.properties?.find(p => p.name === extractor.property);

    return property!;
  }

  static async saveModelProcess(
    extractorId: ObjectIdSchema,
    status: ModelStatus = ModelStatus.processing,
    findingSuggestions = true
  ) {
    const [currentModel] = await ixmodels.get({ extractorId });

    await ixmodels.save({
      ...currentModel,
      status,
      creationDate: new Date().getTime(),
      extractorId,
      findingSuggestions,
    });
  }

  static extractCurrentValue({ entity, targetProperty }: ExtractCurrentValueInput) {
    const isMultiValued = propertyIsMultiValued(targetProperty.type);

    if (targetProperty.name === 'title') {
      return entity.title!;
    }

    const values = entity.metadata?.[targetProperty.name]?.map(i => String(i.value));
    if (!values) {
      return null;
    }

    return isMultiValued ? values : values[0];
  }

  static extractLabeledValueFromFile({ file, targetProperty }: ExtractLabelTextForPDFInput) {
    return (
      file.extractedMetadata?.find(m => m.name === targetProperty.name)?.selection?.text || null
    );
  }

  static extractLabeledValueFromEntity({
    entity,
    targetProperty,
  }: ExtractLabeledValueFromEntityInput) {
    if (targetProperty.name === 'title') {
      return entity.title as string;
    }

    const value = entity?.metadata?.[targetProperty.name]?.[0]?.value;

    return value ? String(value) : null;
  }
}
