import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';
import { RequestEntityTranslation } from 'api/externalIntegrations.v2/automaticTranslation/RequestEntityTranslation';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { AutomaticTranslationFactory } from 'api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { tenants } from 'api/tenants';
import { ATEntityCreationListener } from '../ATEntityCreationListener';

const factory = getFixturesFactory();

const prepareATFactory = (executeSpy: jest.Mock<any, any, any>) => {
  // @ts-ignore
  const ATFactory: typeof AutomaticTranslationFactory = {
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

    executeSpy = jest.fn();

    listener = new ATEntityCreationListener(
      eventBus,
      AutomaticTranslationFactory.defaultATConfigService(),
      prepareATFactory(executeSpy)
    );
    listener.start();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Request entity translation', () => {
    it('should not request translations if feature flag is off', async () => {
      const entityCreationEvent = new EntityCreatedEvent({
        entities: [{ sharedId: 'entity 1' }],
        targetLanguageKey: 'en',
      });

      await tenants.run(async () => {
        await eventBus.emit(entityCreationEvent);
      }, 'tenant');

      expect(executeSpy).not.toHaveBeenCalled();
    });

    it('should call RequestEntityTranslation on receiving entity creation event', async () => {
      await testingEnvironment.setFixtures({
        settings: [{ features: { automaticTranslation: { active: true } } }],
      });
      const entityEn = factory.entity('entity1', 'template1', {}, { language: 'en' });
      const entityCreationEvent = new EntityCreatedEvent({
        entities: [factory.entity('entity1', 'template1', {}, { language: 'es' }), entityEn],
        targetLanguageKey: 'en',
      });

      await tenants.run(async () => {
        await eventBus.emit(entityCreationEvent);
      }, 'tenant');

      expect(executeSpy).toHaveBeenCalledWith(entityEn);
    });
  });
});
