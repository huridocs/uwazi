
import { testingEnvironment } from 'api/utils/testingEnvironment.js';
// @ts-expect-error TS(2307): Cannot find module '../settings.js' or its corresp... Remove this comment to see the full error message
import settings from '../settings.js';
// @ts-expect-error TS(2307): Cannot find module '../templates.js' or its corres... Remove this comment to see the full error message
import templates from '../templates.js';
// @ts-expect-error TS(2307): Cannot find module '../thesauri.js' or its corresp... Remove this comment to see the full error message
import thesauri from '../thesauri.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/JSONRequest.js' o... Remove this comment to see the full error message
import request from 'shared/JSONRequest.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/settingsTyp... Remove this comment to see the full error message
import { PreserveConfig } from 'shared/types/settingsType.js.js';
import fixtures, { userId1, userId2 } from './fixtures';
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
        // @ts-expect-error TS(7006): Parameter 'conf' implicitly has an 'any' type.
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
        // @ts-expect-error TS(7006): Parameter 'prop' implicitly has an 'any' type.
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

        await expect(Preserve.setup('en', { _id: 'someid' })).rejects.toMatchObject({
          message: 'Preserve configuration not found',
          code: 402,
        });
      });
    });
  });
});
