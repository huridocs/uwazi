import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { EntityCreatedEvent } from 'api/entities/events/EntityCreatedEvent';
import { EventsBus } from 'api/eventsbus';
import { AutomaticTranslationFactory } from 'api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { ATExternalAPI } from 'api/externalIntegrations.v2/automaticTranslation/infrastructure/ATExternalAPI';
import { MongoATConfigDataSource } from 'api/externalIntegrations.v2/automaticTranslation/infrastructure/MongoATConfigDataSource';
import { RequestEntityTranslation } from 'api/externalIntegrations.v2/automaticTranslation/RequestEntityTranslation';
import { ATConfigService } from 'api/externalIntegrations.v2/automaticTranslation/services/GetAutomaticTranslationConfig';
import { permissionsContext } from 'api/permissions/permissionsContext';
import { DefaultSettingsDataSource } from 'api/settings.v2/database/data_source_defaults';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { tenants } from 'api/tenants';
import { appContext } from 'api/utils/AppContext';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { UserSchema } from 'shared/types/userType';
import { ATEntityCreationListener } from '../ATEntityCreationListener';

const factory = getFixturesFactory();

const prepareATFactory = (executeSpy: jest.Mock<any, any, any>) => {
  // @ts-ignore
  const ATFactory: typeof AutomaticTranslationFactory = {
    defaultATConfigService() {
      const transactionManager = DefaultTransactionManager();
      return new ATConfigService(
        DefaultSettingsDataSource(transactionManager),
        new MongoATConfigDataSource(getConnection(), transactionManager),
        DefaultTemplatesDataSource(transactionManager),
        new ATExternalAPI()
      );
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
  let userInContext: UserSchema | undefined = {} as UserSchema;

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ features: { automaticTranslation: { active: false } } }],
    });
    await testingEnvironment.setTenant('tenant');

    executeSpy = jest.fn().mockImplementation(() => {
      userInContext = permissionsContext.getUserInContext();
    });

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

      it('should execute RequestEntityTranslation with commandUser as its context user', async () => {
        expect(userInContext).toBe(permissionsContext.commandUser);
      });
    });
  });
});
