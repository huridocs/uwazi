import { IXExtractorType } from '#shared/types/extractorType.js';
import { PropertySchema } from '#shared/types/commonTypes.js';
import settings from '#api/settings/index.js';
import { ObjectId } from 'mongodb';
import entities from '#api/entities/index.js';
import thesauri from '#api/thesauri/index.js';
import _ from 'lodash';
import { EnforcedWithId } from '#api/odm/index.js';
import { IXTaskManager, TaskParameters } from './InformationExtraction.js';
import { propertyTypeIsSelectOrMultiSelect } from './ixMaterials.js';
import { IXServices } from './IXServices.js';

type Props = {
  taskManager: IXTaskManager;
  tenantName: string;
};

type CreateModelTaskInput = {
  extractor: EnforcedWithId<IXExtractorType>;
};

export class IXTaskService {
  constructor(private props: Props) {}

  // eslint-disable-next-line max-statements
  async createModelTask({ extractor }: CreateModelTaskInput) {
    const targetProperty = await IXServices.getTargetProperty({ extractor });

    const params: TaskParameters = {
      id: extractor._id.toString(),
      multi_value: targetProperty.type === 'multiselect' || targetProperty.type === 'relationship',
      metadata: {
        extractor_name: extractor.name || '',
        property: extractor.property || '',
        templates: extractor.templates ? extractor.templates.join(',') : '',
      },
    };

    if (propertyTypeIsSelectOrMultiSelect(targetProperty.type)) {
      const currentThesauri = await thesauri.getById(targetProperty.content);
      const [groups, rootValues] = _.partition(currentThesauri?.values || [], r => r.values);
      const groupedValues = groups.map(group => group.values || []).flat();
      const allValues = rootValues.concat(groupedValues);

      params.options =
        allValues.map(value => ({ label: value.label, id: value.id as string })) || [];
    }
    if (targetProperty.type === 'relationship') {
      const candidates = await this.fetchCandidates(targetProperty);
      params.options = candidates.map(candidate => ({
        label: candidate.title || '',
        id: candidate.sharedId || '',
      }));
    }

    await this.props.taskManager.startTask({
      task: 'create_model',
      tenant: this.props.tenantName,
      params,
    });
  }

  // eslint-disable-next-line class-methods-use-this
  private async fetchCandidates(targetProperty: PropertySchema) {
    const defaultLanguageKey = (await settings.getDefaultLanguage()).key;
    const query: { template?: ObjectId; language: string } = {
      language: defaultLanguageKey,
    };
    if (targetProperty.content !== '') query.template = new ObjectId(targetProperty.content);
    const candidates = await entities.getUnrestricted(query, ['title', 'sharedId']);
    return candidates;
  }
}
