import { EnforcedWithId } from 'api/odm';
import templatesModel from 'api/templates/templatesModel';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { IXExtractorType } from 'shared/types/extractorType';
import { ModelStatus } from 'shared/types/IXModelSchema';
import ixmodels from './ixmodels';

type GetTargetPropertyInput = {
  extractor: EnforcedWithId<IXExtractorType>;
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
}
