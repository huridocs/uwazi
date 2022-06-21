import { testingEnvironment } from 'api/utils/testingEnvironment';
import settings from 'api/settings';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { ObjectIdSchema } from 'shared/types/commonTypes.js';
import { DBFixture } from 'api/utils/testing_db';
import fixtures from './fixtures.js';
import { Preserve } from '../preserve';

describe('Preserve', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures as DBFixture, 'preserve-index');
  });
  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('setup()', () => {
    it('should be create a thesauri, template and a config when no config is found.', async () => {
      await Preserve.setup('en');
      const savedSettings: any = await settings.get({});
      const preserveTemplateId: ObjectIdSchema =
        savedSettings.features?.preserve?.config[0].template;
      expect(preserveTemplateId).toBeDefined();
      const template = await templates.getById(preserveTemplateId.toString());
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
    it('should not create template if configs exists in the DB', async () => {
      const newFixtures = {
        ...fixtures,
        settings: [
          {
            ...fixtures.settings[0],
            features: {
              ...fixtures.settings[0].features,
              preserve: {
                ...fixtures.settings[0].features.preserve,
                config: [
                  {
                    template: 'sometemplateId',
                    token: 'sometoken',
                  },
                ],
              },
            },
          },
        ],
      };
      await testingEnvironment.setUp(newFixtures, 'preserve-index');
      jest.spyOn(Preserve, 'createTemplate');
      await Preserve.setup('en');
      expect(Preserve.createTemplate).not.toHaveBeenCalled();
    });
  });
});
