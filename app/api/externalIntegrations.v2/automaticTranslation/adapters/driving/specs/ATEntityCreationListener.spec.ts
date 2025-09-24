
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults.js';
// @ts-expect-error TS(2307): Cannot find module '../entities/events/EntityCreat... Remove this comment to see the full error message
import { EntityCreatedEvent } from '../entities/events/EntityCreatedEvent.js';
// @ts-expect-error TS(2307): Cannot find module '../eventsbus.js' or its corres... Remove this comment to see the full error message
import { EventsBus } from '../eventsbus.js';
// @ts-expect-error TS(2307): Cannot find module '../externalIntegrations.v2/aut... Remove this comment to see the full error message
import { AutomaticTranslationFactory } from '../externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../externalIntegrations.v2/aut... Remove this comment to see the full error message
import { RequestEntityTranslation } from '../externalIntegrations.v2/automaticTranslation/RequestEntityTranslation.js';
// @ts-expect-error TS(2307): Cannot find module '../tenants.js' or its correspo... Remove this comment to see the full error message
import { tenants } from 'api/tenants/index.js';
// @ts-expect-error TS(2307): Cannot find module '../utils/AppContext.js' or its... Remove this comment to see the full error message
import { appContext } from '../utils/AppContext.js';

import { getFixturesFactory } from 'api/utils/fixturesFactory.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';
import { ATEntityCreationListener } from '../ATEntityCreationListener';

const factory = getFixturesFactory();

const prepareATFactory = (executeSpy: jest.Mock<any, any, any>) => {
  // @ts-ignore
  const ATFactory: typeof AutomaticTranslationFactory = {
    defaultATConfigDataSource() {
      const transactionManager = DefaultTransactionManager();
      return AutomaticTranslationFactory.defaultATConfigDataSource(transactionManager);
    },
    defaultRequestEntityTranslation() {
      return { execute: executeSpy } as unknown as RequestEntityTranslation;
    },
  };

  return ATFactory;
};

describe('ATEntityCreationListener', () => {
  let listener: ATEntityCreationListener;
  const eventBus: EventsBus = new EventsBus();
  let executeSpy: jest.Mock<any, any, any>;

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ features: { automaticTranslation: { active: false } } }],
    });
    await testingEnvironment.setTenant('tenant');

    executeSpy = jest.fn().mockImplementation(() => {});

    listener = new ATEntityCreationListener(eventBus, prepareATFactory(executeSpy));
    listener.start();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Request entity translation', () => {
    describe('when feature flag is off', () => {
      it('should not request translations', async () => {
        const entityCreationEvent = new EntityCreatedEvent({
          entities: [{ sharedId: 'entity 1' }],
          targetLanguageKey: 'en',
        });

        await tenants.run(async () => {
          await eventBus.emit(entityCreationEvent);
        }, 'tenant');

        expect(executeSpy).not.toHaveBeenCalled();
      });
    });

    describe('when feature flag is on', () => {
      const entityEn = factory.entity('entity1', 'template1', {}, { language: 'en' });
      beforeEach(async () => {
        await testingEnvironment.setFixtures({
          settings: [{ features: { automaticTranslation: { active: true } } }],
        });
        testingEnvironment.resetPermissions();
        const entityCreationEvent = new EntityCreatedEvent({
          entities: [factory.entity('entity1', 'template1', {}, { language: 'es' }), entityEn],
          targetLanguageKey: 'en',
        });

        await appContext.run(async () => {
          await eventBus.emit(entityCreationEvent);
        });
      });

      it('should execute RequestEntityTranslation on receiving entity creation event', async () => {
        expect(executeSpy).toHaveBeenCalledWith(entityEn);
      });
    });
  });
});
