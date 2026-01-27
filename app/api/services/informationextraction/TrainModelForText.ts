/* eslint-disable max-classes-per-file */
/* eslint-disable max-statements */

import { UseCase } from '#api/common.v2/contracts/UseCase.js';

import { ArrayUtils } from '#api/common.v2/utils/Array.js';
import urljoin from 'url-join';

import request from '#shared/JSONRequest.js';

import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import moment from 'moment';

import { emitToTenant } from '#api/socketio/setupSockets.js';

import { EnforcedWithId } from '#api/odm/index.js';

import { IXExtractorType } from '#shared/types/extractorType.js';

import { Suggestions } from '#api/suggestions/suggestions.js';
import { PropertySourceMaterials } from '#api/services/informationextraction/InformationExtraction.js';
import { IXTaskService } from '#api/services/informationextraction/TaskService.js';
import { IXServices } from '#api/services/informationextraction/IXServices.js';
import { ExtractionKey } from '#api/services/informationextraction/ExtractionKey.js';
import { IXWebSocketEvents } from '#api/services/informationextraction/WebSocketEvents.js';
import ixmodels from '#api/services/informationextraction/ixmodels.js';
import { IXSuggestionsModel } from '#api/suggestions/IXSuggestionsModel.js';
import { getPropertyTrainingEntities } from './FetchMaterialsForTraining.js';

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
      const entities = await getPropertyTrainingEntities(extractor);

      if (!entities.length) {
        throw new NoEntitiesForTraining();
      }

      const processedEntityIds: string[] = [];
      const targetProperty = await IXServices.getTargetProperty({ extractor });

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

        // Attach useForTraining flag for this entity-language if any suggestion is marked
        const [marked] = await IXSuggestionsModel.db
          .find({
            extractorId: extractor._id,
            entityId: entity.sharedId,
            language: entity.language,
            useForTraining: true,
          })
          .limit(1)
          .select({ _id: 1 })
          .lean();
        if (marked) {
          data.useForTraining = true;
        }

        if (['multiselect', 'relationship', 'select'].includes(targetProperty.type)) {
          const values = entity?.metadata?.[extractor.property]?.map(({ value, label }) => ({
            id: String(value),
            label,
          }));

          const hasValue = !!values?.filter((v: { id: string }) => !!v.id)?.length;
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
