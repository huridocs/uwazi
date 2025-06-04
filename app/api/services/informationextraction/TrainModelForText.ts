/* eslint-disable max-statements */
import { UseCase } from 'api/common.v2/contracts/UseCase';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import urljoin from 'url-join';
import request from 'shared/JSONRequest';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import moment from 'moment';
import { emitToTenant } from 'api/socketio/setupSockets';
import { EnforcedWithId } from 'api/odm';
import { IXExtractorType } from 'shared/types/extractorType';
import { getEntitiesForTraining } from './getFiles';
import { PropertySourceMaterials } from './InformationExtraction';
import { IXTaskService } from './TaskService';
import { IXServices } from './IXServices';
import { ExtractionKey } from './ExtractionKey';
import { IXModelsModel } from './IXModelsModel';
import { IXWebSocketEvents } from './WebSocketEvents';

type Input = {
  extractor: EnforcedWithId<IXExtractorType>;
};

type Output = any;

type Dependencies = {
  serviceUrl: string;
  tenantName: string;
  iXTaskService: IXTaskService;
};

export class TrainModelForText implements UseCase<Input, Output> {
  constructor(private props: Dependencies) {}

  async execute({ extractor }: Input): Promise<Output> {
    const extractorId = extractor._id.toString();

    const entities = await getEntitiesForTraining(
      extractor.templates,
      extractor.property,
      extractor.source.property!
    );

    if (!entities.length) {
      await IXModelsModel.save(
        {
          findingSuggestions: false,
        },
        { extractorId }
      );

      emitToTenant(this.props.tenantName, IXWebSocketEvents.NoEntitiesForTraining, {
        message: 'No Entities found for training.',
      });

      return;
    }

    const targetProperty = await IXServices.getTargetProperty({ extractor });

    await ArrayUtils.sequentialFor(entities, async entity => {
      const extractionKey = ExtractionKey.create({
        entitySharedId: entity.sharedId!,
        language: entity.language as LanguageISO6391,
      });

      const data: PropertySourceMaterials = {
        entity_name: extractionKey.key,
        language_iso: extractionKey.language,
        id: extractorId,
        tenant: this.props.tenantName,
        source_text: (entity.metadata?.[extractor.source.property!]?.[0]?.value as string) || '',
      };

      if (extractor.source.property === 'title') {
        data.source_text = entity.title || '';
      }

      if (['multiselect', 'relationship', 'select'].includes(targetProperty.type)) {
        const values = entity?.metadata?.[extractor.property]?.map(({ value, label }) => ({
          id: String(value),
          label,
        }));

        const hasValue = !!values?.filter(v => !!v.id)?.length;
        if (!values || !hasValue) {
          return;
        }

        data.values = values as { id: string; label: string }[];
      } else {
        let labelText = entity.metadata?.[extractor.property]?.[0]?.value;

        if (targetProperty.type === 'date') {
          labelText = moment(Number(labelText) * 1000).format('YYYY-MM-DD');
        }

        if (extractor.property === 'title') {
          labelText = entity.title;
        }

        if (typeof labelText === 'undefined') {
          return;
        }

        data.label_text = String(labelText);
      }

      await request.post(urljoin(this.props.serviceUrl, 'labeled_data'), data);
    });

    await this.props.iXTaskService.createModelTask({
      extractor,
    });
  }
}
