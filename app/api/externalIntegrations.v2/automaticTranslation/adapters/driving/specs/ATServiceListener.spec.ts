import { config } from '#api/config.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { AutomaticTranslationFactory } from '#api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
import { SaveEntityTranslations } from '#api/externalIntegrations.v2/automaticTranslation/SaveEntityTranslations.js';
import { permissionsContext } from '#api/permissions/permissionsContext.js';
import { tenants } from '#api/tenants/tenantContext.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import RedisSMQ from 'rsmq';
import { UserSchema } from '#shared/types/userType.js';
import waitForExpect from 'wait-for-expect';
import { ATServiceListener } from '../ATServiceListener.js';
import { Redis } from '#api/infrastructure/Redis.js';
import { RedisClient } from 'redis';

const prepareATFactory = (executeSpy: jest.Mock<any, any, any>) => {
  // @ts-ignore
  const ATFactory: typeof AutomaticTranslationFactory = {
    defaultSaveEntityTranslations() {
      return { execute: executeSpy } as unknown as SaveEntityTranslations;
    },
  };

  return ATFactory;
};

const registerTenant1 = () => {
  tenants.add(
    testingTenants.createTenant({
      name: 'tenant1',
      dbName: 'tenant1',
      indexName: 'index',
      domain: '127.0.0.1',
      featureFlags: { postgresCore: true },
    })
  );
  testingTenants.restoreCurrentFn();
};

const resetResultsQueue = async (redisSMQ: RedisSMQ) => {
  const resultsQueue = `${config.ENVIRONMENT}_${ATServiceListener.SERVICE_NAME}_results`;
  try {
    await redisSMQ.deleteQueueAsync({ qname: resultsQueue });
  } catch (error: any) {
    if (error.name !== 'queueNotFound') {
      throw error;
    }
  }
  await redisSMQ.createQueueAsync({ qname: resultsQueue });
};

describe('ATServiceListener tenant routing', () => {
  let listener: ATServiceListener;
  let redisClient: RedisClient;
  let redisSMQ: RedisSMQ;
  let executeSpy: jest.Mock<any, any, any>;
  let tenantInContext: string | undefined;

  beforeEach(async () => {
    redisClient = await Redis.connect();
    redisSMQ = new RedisSMQ({ client: redisClient });
    await resetResultsQueue(redisSMQ);
    registerTenant1();

    tenantInContext = undefined;
    executeSpy = jest.fn().mockImplementation(() => {
      tenantInContext = ExecutionContext.currentTenant.name;
    });

    listener = new ATServiceListener(prepareATFactory(executeSpy));
    listener.start(0);
  });

  afterAll(async () => {
    await listener.stop();
    await Redis.disconnect();
    testingTenants.restoreCurrentFn();
  });

  it('runs saveEntityTranslations in the tenant carried by the result key', async () => {
    const message = {
      key: ['tenant1', 'sharedId', 'propName'],
      text: 'original text',
      language_from: 'en',
      languages_to: ['es'],
      translations: [{ text: 'texto traducido', language: 'es', success: true, error_message: '' }],
    };

    await redisSMQ.sendMessageAsync({
      qname: `${config.ENVIRONMENT}_${ATServiceListener.SERVICE_NAME}_results`,
      message: JSON.stringify(message),
    });

    await waitForExpect(async () => {
      expect(tenantInContext).toBe('tenant1');
    });
  });
});

describe('ATServiceListener', () => {
  let listener: ATServiceListener;
  let redisClient: RedisClient;
  let redisSMQ: RedisSMQ;
  let executeSpy: jest.Mock<any, any, any>;
  let userInContext: UserSchema | undefined = {} as UserSchema;

  beforeEach(async () => {
    redisClient = await Redis.connect();
    await testingEnvironment.setUp({
      settings: [{ features: { automaticTranslation: { active: true } } }],
    });
    testingEnvironment.resetPermissions();
    testingEnvironment.unsetFakeContext();
    await testingEnvironment.setTenant('tenant');

    executeSpy = jest.fn().mockImplementation(() => {
      userInContext = permissionsContext.getUserInContext();
    });

    listener = new ATServiceListener(prepareATFactory(executeSpy));
    redisSMQ = new RedisSMQ({ client: redisClient });

    const recreateQueue = async (queueName: string): Promise<void> => {
      try {
        await redisSMQ.getQueueAttributesAsync({ qname: queueName });
        await redisSMQ.deleteQueueAsync({ qname: queueName });
      } catch (error: any) {
        if (error.name === 'queueNotFound') {
          // No action needed
        } else {
          throw error;
        }
      }

      await redisSMQ.createQueueAsync({ qname: queueName });
    };

    await recreateQueue(`${ATServiceListener.SERVICE_NAME}_results`).catch(error => {
      throw error;
    });

    listener.start(0);
  });

  afterAll(async () => {
    await Redis.disconnect();
    await listener.stop();
    await testingEnvironment.tearDown();
  });

  describe('Save Translations', () => {
    const message = {
      key: ['tenant', 'sharedId', 'propName'],
      text: 'original text',
      language_from: 'en',
      languages_to: ['es'],
      translations: [{ text: 'texto traducido', language: 'es', success: true, error_message: '' }],
    };

    beforeEach(async () => {
      executeSpy.mockClear();

      await redisSMQ.sendMessageAsync({
        qname: `${config.ENVIRONMENT}_${ATServiceListener.SERVICE_NAME}_results`,
        message: JSON.stringify(message),
      });
    });

    it('should execute saveEntityTranslations after validating the result', async () => {
      await waitForExpect(async () => {
        expect(executeSpy).toHaveBeenCalledWith(message);
      });
    });

    it('should execute saveEntityTranslations with commandUser as its context user', async () => {
      await waitForExpect(async () => {
        expect(userInContext).toBe(permissionsContext.commandUser);
      });
    });
  });
});
