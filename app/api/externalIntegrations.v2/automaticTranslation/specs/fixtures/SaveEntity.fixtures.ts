import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { LanguageISO6391 } from 'shared/types/commonTypes';

export const saveEntityFixtures = (factory: ReturnType<typeof getFixturesFactory>) => ({
  templates: [
    factory.template('template1', [
      {
        _id: factory.id('propertyName'),
        name: 'propertyName',
        type: 'text',
        label: 'Prop 1',
      },
    ]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'pt', 'es'], 'entity', 'template1', {
      propertyName: [{ value: 'original text' }],
    }),
    ...factory.entityInMultipleLanguages(
      ['en', 'pt', 'es'],
      'entity_with_wrong_template',
      'wrong_template',
      {
        propertyName: [{ value: 'original text' }],
      }
    ),
  ],
  settings: [
    {
      languages: [
        { label: 'en', key: 'en' as LanguageISO6391, default: true },
        { label: 'pt', key: 'pt' as LanguageISO6391 },
        { label: 'es', key: 'es' as LanguageISO6391 },
      ],
    },
  ],
});
