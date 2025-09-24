// @ts-expect-error TS(2307): Cannot find module '../config.js' or its correspon... Remove this comment to see the full error message
import { config } from '../config.js';
// @ts-expect-error TS(2307): Cannot find module '../externalIntegrations.v2/aut... Remove this comment to see the full error message
import { AutomaticTranslationFactory } from '../externalIntegrations.v2/automaticTranslation/AutomaticTranslationFactory.js';
// @ts-expect-error TS(2307): Cannot find module '../externalIntegrations.v2/aut... Remove this comment to see the full error message
import { SaveEntityTranslations } from '../externalIntegrations.v2/automaticTranslation/SaveEntityTranslations.js';
// @ts-expect-error TS(2307): Cannot find module '../permissions/permissionsCont... Remove this comment to see the full error message
import { permissionsContext } from '../permissions/permissionsContext.js';

import { testingEnvironment } from 'api/utils/testingEnvironment.js';
import RedisSMQ from 'rsmq';

import { UserSchema } from 'shared/types/userType.js';
import waitForExpect from 'wait-for-expect';
import { ATServiceListener } from '../ATServiceListener.js';
// @ts-expect-error TS(2307): Cannot find module '../infrastructure/Redis.js' or... Remove this comment to see the full error message
import { Redis } from '../infrastructure/Redis.js';
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
