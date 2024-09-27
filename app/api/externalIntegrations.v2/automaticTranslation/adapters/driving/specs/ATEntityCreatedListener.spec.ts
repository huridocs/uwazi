import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';
import { RequestEntityTranslation } from 'api/externalIntegrations.v2/automaticTranslation/RequestEntityTranslation';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { AutomaticTranslationFactory } from 'api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { ATEntityCreationListener } from '../ATEntityCreationListener';

const factory = getFixturesFactory();

describe('ATEntityCreationListener', () => {
  let listener: ATEntityCreationListener;
  const eventBus: EventsBus = new EventsBus();
  let requestEntityTranslation: RequestEntityTranslation;

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ features: { automaticTranslation: { active: true } } }],
    });
    await testingEnvironment.setTenant('tenant');

    requestEntityTranslation = AutomaticTranslationFactory.defaultRequestEntityTranslation();
    jest.spyOn(requestEntityTranslation, 'execute');

    listener = new ATEntityCreationListener(requestEntityTranslation, eventBus);
    listener.start();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Request entity translation', () => {
    it('should call RequestEntityTranslation on receiving entity creation event', async () => {
      const entityEn = factory.entity('entity1', 'template1', {}, { language: 'en' });
      const entityCreationEvent = new EntityCreatedEvent({
        entities: [factory.entity('entity1', 'template1', {}, { language: 'es' }), entityEn],
        targetLanguageKey: 'en',
      });

      await eventBus.emit(entityCreationEvent);

      expect(requestEntityTranslation.execute).toHaveBeenCalledWith(entityEn);
    });
  });
});
