import { testingEnvironment } from 'api/utils/testingEnvironment';
import settings from 'api/settings';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import request from 'shared/JSONRequest';
import { PreserveConfig } from 'shared/types/settingsType.js';
import fixtures, { userId1, userId2 } from './fixtures.js';
import { Preserve } from '../preserve';

describe('Preserve', () => {
  const user = { _id: userId1 };
  beforeAll(async () => {
    jest.spyOn(request, 'post').mockImplementation(async () =>
      Promise.resolve({
        json: { data: { token: 'sometoken' } },
        status: 200,
        headers: new Headers(),
        cookie: 'cookie',
        endpoint: { url: 'fake url', method: 'GET' },
      })
    );
    await testingEnvironment.setUp(fixtures, 'preserve-index');
  });
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('setup()', () => {
    describe('pass', () => {
      it('should create a thesauri, template and a config when no config is found.', async () => {
        await Preserve.setup('en', user);
        const savedSettings: any = await settings.get({});
        const configs: PreserveConfig['config'] = savedSettings.features.preserve.config;
        const config = configs.find(conf => conf.user!.toString() === user._id.toString());
        expect(config?.template).toBeDefined();
        const template = await templates.getById(config!.template.toString());
        expect(template?.name).toBe('Preserve');
        expect(template?.properties).toMatchObject([
          {
            type: 'link',
            name: 'url',
            label: 'Url',
          },
          {
            type: 'select',
            name: 'source',
            label: 'Source',
          },
        ]);
        const thesauriId = template?.properties?.find(prop => prop.type === 'select')?.content;
        const thesaurus = await thesauri.getById(thesauriId);
        expect(thesaurus?.name).toBe('Preserve');
      });

      it('should not create template if another configs exists in the DB', async () => {
        const savedTemplates = await templates.get({});
        await Preserve.setup('en', { _id: userId2 });
        const templatesAfterSetup = await templates.get({});
        expect(savedTemplates.length).toEqual(templatesAfterSetup.length);
        const savedSettings: any = await settings.get({});
        const savedConfigs = savedSettings.features.preserve.config;
        expect(savedConfigs[0].template).toEqual(savedConfigs[1].template);
      });
    });

    describe('fail', () => {
      it('should throw an error if preserve feature is not configured', async () => {
        const newSettings = [
          {
            ...fixtures.settings,
            features: {},
          },
        ];
        await testingEnvironment.setUp({ ...fixtures, settings: newSettings }, 'preserve-index');

        await expect(Preserve.setup('en', { _id: 'someid' })).rejects.toEqual({
          message: 'Preserve configuration not found',
          code: 402,
        });
      });
    });
  });
});
