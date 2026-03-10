import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { RequestEntityTranslation } from '../../RequestEntityTranslation';
import { SaveEntityTranslations } from '../../SaveEntityTranslations';
import { ATSolveVersionConflict } from '../ATSolveVersionConflict';

const factory = getFixturesFactory();

beforeEach(async () => {
  jest.spyOn(process.stdout, 'write').mockReturnThis();
  const fixtures = {
    templates: [
      factory.template('template', [
        factory.property('prop1'),
        factory.property('prop2'),
        factory.property('prop3'),
        factory.property('prop4'),
      ]),
    ],
    settings: [
      {
        features: {
          automaticTranslation: {
            active: true,
            templates: [
              {
                template: factory.idString('template'),
                properties: [
                  factory.idString('prop1'),
                  factory.idString('prop2'),
                  factory.idString('prop3'),
                  factory.idString('prop4'),
                ],
                commonProperties: [factory.commonPropertiesTitleId('template')],
              },
            ],
          },
        },
      },
    ],
  };
  await testingEnvironment.setUp(fixtures);
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe('ATSolveVersionConflict', () => {
  describe('when AT feature is deactivated', () => {
    it('should return newEntity', async () => {
      const fixtures = {
        settings: [{ features: { automaticTranslation: { active: false } } }],
      };
      await testingEnvironment.setUp(fixtures);
      const currentEntity = factory.entity('current entity', 'template', {
        prop1: [{ value: 'old text' }],
      });
      const newEntity = factory.entity('new entity', 'template', {
        prop1: [{ value: 'new text' }],
      });
      expect(await ATSolveVersionConflict(currentEntity, newEntity)).toBe(newEntity);
    });
  });

  describe('when current entity has translated properties but newEntity comes with "pending translation"', () => {
    it('should replace the pending ones for the already translated property', async () => {
      const currentEntity = factory.entity(
        'current entity',
        'template',
        {
          prop1: [{ value: 'text' }],
          prop2: [{ value: `${SaveEntityTranslations.AITranslatedText} text` }],
          prop4: [{ value: `${SaveEntityTranslations.AITranslatedText} text` }],
        },
        {
          title: `${SaveEntityTranslations.AITranslatedText} current entity`,
        }
      );
      const newEntity = factory.entity(
        'new entity',
        'template',
        {
          prop1: [{ value: 'text' }],
          prop2: [{ value: `${RequestEntityTranslation.AITranslationPendingText} text` }],
          prop3: [{ value: 'text' }],
          prop4: [{ value: `${RequestEntityTranslation.AITranslationPendingText} text` }],
        },
        {
          title: `${RequestEntityTranslation.AITranslationPendingText} new entity`,
        }
      );
      expect(await ATSolveVersionConflict(currentEntity, newEntity)).toMatchObject({
        title: `${SaveEntityTranslations.AITranslatedText} current entity`,
        metadata: {
          prop1: [{ value: 'text' }],
          prop2: [{ value: `${SaveEntityTranslations.AITranslatedText} text` }],
          prop3: [{ value: 'text' }],
          prop4: [{ value: `${SaveEntityTranslations.AITranslatedText} text` }],
        },
      });
    });

    it('should not fail if the props have no value', async () => {
      const currentEntity = factory.entity('current entity', 'template', { prop1: [] });
      const newEntity = factory.entity('new entity', 'template', {
        prop1: [],
        prop2: [{ value: 'prop2' }],
      });

      await expect(ATSolveVersionConflict(currentEntity, newEntity)).resolves.toMatchObject({
        title: 'new entity',
        metadata: { prop1: [], prop2: [{ value: 'prop2' }] },
      });
    });
  });
});
