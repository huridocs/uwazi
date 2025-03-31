/* eslint-disable max-classes-per-file */
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { ValidationError } from 'api/common.v2/validation/ValidationError';
import entities from 'api/entities';
import { denormalizeMetadata } from 'api/entities/denormalize';
import { MongoPXEntitiesStatusDataSource } from 'api/paragraphExtraction/infrastructure/MongoPXEntitiesStatusDataSource';
import { PXCreateParagraphsFactory } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsFactory';
import { PXCreateParagraphsJob } from 'api/paragraphExtraction/infrastructure/PXCreateParagraphsJob';
import { PXExtractionServiceFactory } from 'api/paragraphExtraction/infrastructure/PXExtractionServiceFactory';
import { PXExtractParagraphsFromEntityJob } from 'api/paragraphExtraction/infrastructure/PXExtractParagraphsFromEntitiesJob';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { Dispatchable, HeartbeatCallback } from 'api/queue.v2/application/contracts/Dispatchable';
import { DispatchableClass } from 'api/queue.v2/application/contracts/JobsDispatcher';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
// import {
//   UpdateTemplateRelationshipPropertiesJob as createUpdateTemplateRelationshipPropertiesJob,
//   UpdateRelationshipPropertiesJob as createUpdateRelationshipPropertiesJob,
// } from 'api/relationships.v2/services/service_factories';
// import { UpdateRelationshipPropertiesJob } from 'api/relationships.v2/services/propertyUpdateStrategies/UpdateRelationshipPropertiesJob';
// eslint-disable-next-line max-len
// import { UpdateTemplateRelationshipPropertiesJob } from 'api/relationships.v2/services/propertyUpdateStrategies/UpdateTemplateRelationshipPropertiesJob';
import templates from 'api/templates';
import { tenants } from 'api/tenants';
import { LanguageISO6391 } from 'shared/types/commonTypes';

function randomIntFromInterval(min: number, max: number) {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export class TestJob implements Dispatchable {
  static BATCH_SIZE = 200;

  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(_heartbeat: HeartbeatCallback) {
    await new Promise((resolve, reject) => {
      setTimeout(
        () => {
          if (Math.floor(Math.random() * 5) === 0) {
            reject(
              new ValidationError([{ path: '/', message: 'Random validation error occurred' }])
            );
          }
          if (Math.floor(Math.random() * 5) === 0) {
            reject(new Error('Random error occurred'));
          }
          resolve({});
        },
        randomIntFromInterval(0, 1500)
      );
    });
  }
}

export class DenormalizeEntityInMemoryTestJob implements Dispatchable {
  static BATCH_SIZE = 200;

  // eslint-disable-next-line class-methods-use-this
  async handleDispatch(
    _heartbeat: HeartbeatCallback,
    params: { sharedId: string; tenantName: string }
  ) {
    await tenants.run(async () => {
      try {
        permissionsContext.setCommandContext();
        const entityInAllLanguages = await entities.getAllLanguages(params.sharedId);
        if (!entityInAllLanguages.length) {
          // throw new ValidationError([{ path: '/', message: 'Random validation error occurred' }]);
          return;
        }
        const template = await templates.getById(entityInAllLanguages[0].template!);
        await entityInAllLanguages.reduce(async (prev, entity) => {
          await prev;
          await denormalizeMetadata(
            entity.metadata!,
            entity.language as LanguageISO6391,
            template!,
            {}
          );
        }, Promise.resolve());
      } finally {
        permissionsContext.setUserInContext(undefined!);
      }
    }, params.tenantName);
  }
}

export function registerJobs(
  register: <T extends Dispatchable>(
    dispatchable: DispatchableClass<T>,
    factory: (namespace: string) => Promise<T>
  ) => void
) {
  // register(UpdateRelationshipPropertiesJob, async () => createUpdateRelationshipPropertiesJob());
  // register(UpdateTemplateRelationshipPropertiesJob, createUpdateTemplateRelationshipPropertiesJob);

  register(DenormalizeEntityInMemoryTestJob, async () => new DenormalizeEntityInMemoryTestJob());
  register(TestJob, async () => new TestJob());

  register(PXExtractParagraphsFromEntityJob, async () => new PXExtractParagraphsFromEntityJob());
  register(PXCreateParagraphsJob, async () => {
    const transactionManager = DefaultTransactionManager();
    return new PXCreateParagraphsJob({
      extractionService: PXExtractionServiceFactory.createDefault(),
      useCase: PXCreateParagraphsFactory.createDefault(),
      pxEntitiesStatusDS: new MongoPXEntitiesStatusDataSource(
        getConnection(),
        transactionManager,
        DefaultSettingsDataSource(transactionManager)
      ),
    });
  });
}
