import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';
import { AutomaticTranslationFactory } from 'api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { RequestEntityTranslation } from 'api/externalIntegrations.v2/automaticTranslation/RequestEntityTranslation';
import { tenants } from 'api/tenants';
import { appContext } from 'api/utils/AppContext';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
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
