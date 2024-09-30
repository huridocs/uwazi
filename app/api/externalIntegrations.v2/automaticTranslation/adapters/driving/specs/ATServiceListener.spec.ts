import { config } from 'api/config';
import { tenants } from 'api/tenants';
import Redis from 'redis';
import RedisSMQ from 'rsmq';
import waitForExpect from 'wait-for-expect';
import { AutomaticTranslationFactory } from 'api/externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { SaveEntityTranslations } from 'api/externalIntegrations.v2/automaticTranslation/SaveEntityTranslations';
import { ATServiceListener } from '../ATServiceListener';

const prepareATFactory = (executeSpy: jest.Mock<any, any, any>) => {
  // @ts-ignore
  const ATFactory: typeof AutomaticTranslationFactory = {
    defaultSaveEntityTranslations() {
      return { execute: executeSpy } as unknown as SaveEntityTranslations;
    },
  };

  return ATFactory;
};

describe('ATServiceListener', () => {
  let listener: ATServiceListener;
  let redisClient: Redis.RedisClient;
  let redisSMQ: RedisSMQ;
  let executeSpy: jest.Mock<any, any, any>;

  beforeEach(async () => {
    await testingEnvironment.setUp({
      settings: [{ features: { automaticTranslation: { active: true } } }],
    });
    await testingEnvironment.setTenant('tenant');

    executeSpy = jest.fn();

    listener = new ATServiceListener(prepareATFactory(executeSpy));
    const redisUrl = `redis://${config.redis.host}:${config.redis.port}`;
    redisClient = Redis.createClient(redisUrl);
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
    redisClient.end(true);
    await listener.stop();
    await testingEnvironment.tearDown();
  });

  describe('Save Translations', () => {
    it('should call on saveEntityTranslations after validating the result', async () => {
      const message = {
        key: ['tenant', 'sharedId', 'propName'],
        text: 'original text',
        language_from: 'en',
        languages_to: ['es'],
        translations: [
          { text: 'texto traducido', language: 'es', success: true, error_message: '' },
        ],
      };

      executeSpy.mockClear();

      await redisSMQ.sendMessageAsync({
        qname: `${config.ENVIRONMENT}_${ATServiceListener.SERVICE_NAME}_results`,
        message: JSON.stringify(message),
      });

      await waitForExpect(async () => {
        await tenants.run(async () => {
          expect(executeSpy).toHaveBeenCalledWith(message);
        }, 'tenant');
      });
    });
  });
});
