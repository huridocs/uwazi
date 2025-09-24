/* eslint-disable max-classes-per-file */
/* eslint-disable max-statements */
// @ts-expect-error TS(2307): Cannot find module '../common.v2/contracts/UseCase... Remove this comment to see the full error message
import { UseCase } from '../common.v2/contracts/UseCase.js';
// @ts-expect-error TS(2307): Cannot find module '../common.v2/utils/Array.js' o... Remove this comment to see the full error message
import { ArrayUtils } from '../common.v2/utils/Array.js';
import urljoin from 'url-join';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import request from 'shared/JSONRequest.js';

import { LanguageISO6391 } from 'shared/types/commonTypes.js';
import moment from 'moment';
// @ts-expect-error TS(2307): Cannot find module '../socketio/setupSockets.js' o... Remove this comment to see the full error message
import { emitToTenant } from '../socketio/setupSockets.js';

import { EnforcedWithId } from '../odm/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/extractorTy... Remove this comment to see the full error message
import { IXExtractorType } from 'shared/types/extractorType.js';
// @ts-expect-error TS(2307): Cannot find module '../suggestions/suggestions.js'... Remove this comment to see the full error message
import { Suggestions } from '../suggestions/suggestions.js';
import { getEntitiesForTraining } from './ixMaterials.js';
import { PropertySourceMaterials } from './InformationExtraction.js';
import { IXTaskService } from './TaskService.js';
import { IXServices } from './IXServices.js';
import { ExtractionKey } from './ExtractionKey.js';
import { IXWebSocketEvents } from './WebSocketEvents.js';
import ixmodels from './ixmodels.js';

type Input = {
  extractor: EnforcedWithId<IXExtractorType>;
};

type Output = any;

type Dependencies = {
  serviceUrl: string;
  tenantName: string;
  iXTaskService: IXTaskService;
};

class NoEntitiesForTraining extends Error {
  static defaultMessage = 'There are not Entities for training the model';

  constructor(message = NoEntitiesForTraining.defaultMessage) {
    super(message);
  }
}

class TrainModelForText implements UseCase<Input, Output> {
  constructor(private props: Dependencies) {}

  async execute({ extractor }: Input): Promise<Output> {
    try {
      const entities = await getEntitiesForTraining(
        extractor.templates,
        extractor.property,
        extractor.source.property!
      );

      if (!entities.length) {
        throw new NoEntitiesForTraining();
      }

      const processedEntityIds: string[] = [];
      const targetProperty = await IXServices.getTargetProperty({ extractor });

      // @ts-expect-error TS(7006): Parameter 'entity' implicitly has an 'any' type.
      await ArrayUtils.sequentialFor(entities, async entity => {
        const extractionKey = ExtractionKey.create({
          entitySharedId: entity.sharedId!,
          language: entity.language as LanguageISO6391,
        });

        const data: PropertySourceMaterials = {
          entity_name: extractionKey.key,
          language_iso: extractionKey.language,
          id: extractor._id.toString(),
          tenant: this.props.tenantName,
          source_text: (entity.metadata?.[extractor.source.property!]?.[0]?.value as string) || '',
        };

        if (extractor.source.property === 'title') {
          data.source_text = entity.title || '';
        }

        if (['multiselect', 'relationship', 'select'].includes(targetProperty.type)) {
          // @ts-expect-error TS(7031): Binding element 'value' implicitly has an 'any' ty... Remove this comment to see the full error message
          const values = entity?.metadata?.[extractor.property]?.map(({ value, label }) => ({
            id: String(value),
            label,
          }));

          // @ts-expect-error TS(7006): Parameter 'v' implicitly has an 'any' type.
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
        processedEntityIds.push(entity.sharedId!);
      });

      await Suggestions.markSuggestionsAsTrainingSamples(
        processedEntityIds,
        extractor._id.toString()
      );

      await this.props.iXTaskService.createModelTask({
        extractor,
      });
    } catch (e) {
      await ixmodels.stopTraining(extractor._id);

      emitToTenant(this.props.tenantName, IXWebSocketEvents.ErrorTrainingModel, {
        message: e.message || 'An error occurred when sending Entities for training',
      });

      throw e;
    }
  }
}

export { NoEntitiesForTraining, TrainModelForText };
