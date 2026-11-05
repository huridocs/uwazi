import {
  pickAdminFields,
  getPublicSettingsPayload,
} from '#api/core/application/settings/publicSettings.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import type { Settings } from '#shared/types/settingsType.js';
import { User } from '#api/users.v2/model/User.js';
import { ObjectId } from 'mongodb';
import { AIAssistantFactory } from '../../infrastructure/AIAssistantFactory.js';

const fixtures = {
  settings: [
    {
      languages: [{ key: 'en' as LanguageISO6391, label: 'English', default: true }],
      site_name: 'Uwazi',
    },
  ],
};

const admin = User.createFrom({
  _id: new ObjectId(),
  role: 'admin',
  groups: [],
  email: 'admin@test.com',
  username: 'admin',
});

const editor = User.createFrom({
  _id: new ObjectId(),
  role: 'editor',
  groups: [],
  email: 'editor@test.com',
  username: 'editor',
});

describe('AI Assistant settings', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  }, 60_000);

  afterAll(async () => {
    await testingEnvironment.tearDown();
  }, 60_000);

  it('should default provider to bert-external', async () => {
    const result = await testingEnvironment.runWithContext(
      async () => AIAssistantFactory.createGetSettings().execute({ includeSecrets: true }),
      { actor: admin }
    );

    expect(result).toEqual({
      provider: 'bert-external',
      requiresPassword: true,
    });
  });

  it('should persist provider config in Mongo and return secrets only when asked', async () => {
    await testingEnvironment.runWithContext(
      async () =>
        AIAssistantFactory.createSaveSettings().execute({
          provider: 'openai_compat',
          apiKey: 'sk-secret',
          baseUrl: 'https://api.openai.com/v1',
          model: 'gpt-4.1-mini',
        }),
      { actor: admin }
    );

    const forAdmin = await testingEnvironment.runWithContext(
      async () => AIAssistantFactory.createGetSettings().execute({ includeSecrets: true }),
      { actor: admin }
    );
    const forEditor = await testingEnvironment.runWithContext(
      async () => AIAssistantFactory.createGetSettings().execute({ includeSecrets: false }),
      { actor: editor }
    );

    expect(forAdmin).toEqual({
      provider: 'openai_compat',
      apiKey: 'sk-secret',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4.1-mini',
      requiresPassword: false,
    });
    expect(forEditor).toEqual({
      provider: 'openai_compat',
      requiresPassword: false,
    });
  });

  it('should not expose AI Assistant keys through public or admin settings allowlists', () => {
    const settings = {
      site_name: 'Uwazi',
      mapApiKey: 'map-key',
      aiAssistant: { provider: 'openai_compat', apiKey: 'sk-secret' },
    } as Settings;

    expect(pickAdminFields(settings).aiAssistant).toBeUndefined();
    expect(getPublicSettingsPayload(settings).aiAssistant).toBeUndefined();
  });
});
