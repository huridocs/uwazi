import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { EntityDTO } from '#api/core/domain/entity/EntityDTO.js';
import { EntityUpdatedEventPayload } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { ProcessRelationshipAfterEntityUpdatedListener } from '../ProcessRelationshipAfterEntityUpdatedListener.js';

const factory = getFixturesFactory();

const fixtures: DBFixture = {
  settings: [
    {
      languages: [
        { default: true, key: 'en', label: 'English' },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  relationtypes: [factory.relationType('rel1')],
  templates: [factory.template('Person', [factory.relationshipProp('friend')])],
  entities: [
    ...factory.entityInMultipleLanguages(['en', 'es'], 'bruce', 'Person'),
    ...factory.entityInMultipleLanguages(['en', 'es'], 'robin', 'Person'),
  ],
};

const translation = (language: LanguageISO6391) => ({
  id: factory.id(`bruce-${language}`).toString(),
  language,
  metadata: {
    title: {
      name: 'title',
      type: 'text',
      value: [{ value: 'bruce' }],
      isTranslatable: true,
    } as PropertyAssignment,
    creationDate: {
      name: 'creationDate',
      type: 'date',
      value: [{ value: 1700000000 }],
      isTranslatable: false,
    } as PropertyAssignment,
    editDate: {
      name: 'editDate',
      type: 'date',
      value: [{ value: 1700000000 }],
      isTranslatable: false,
    } as PropertyAssignment,
    friend: {
      name: 'friend',
      type: 'relationship',
      value: [{ value: 'robin' }],
      isTranslatable: false,
    } as PropertyAssignment,
  },
});

const bruce: EntityDTO = {
  sharedId: 'bruce',
  templateId: factory.id('Person').toString(),
  translations: [translation('en'), translation('es')],
};

const connectionsOf = async () =>
  (await testingEnvironment.db.getAllFrom('connections')).map(({ entity }) => entity).sort();

describe('ProcessRelationshipAfterEntityUpdatedListener', () => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should save the entity-based references once for all changed languages', async () => {
    const payload: EntityUpdatedEventPayload = {
      before: bruce,
      after: bruce,
      targetLanguage: 'en',
      changedLanguages: ['en', 'es'],
    };

    await testingEnvironment.runWithContext(async () =>
      new ProcessRelationshipAfterEntityUpdatedListener({}).handleDispatch(
        async () => Promise.resolve(),
        payload as never
      )
    );

    expect(await connectionsOf()).toEqual(['bruce', 'robin']);
  });

  it('should save the references of an event queued before changedLanguages existed', async () => {
    await testingEnvironment.runWithContext(async () =>
      new ProcessRelationshipAfterEntityUpdatedListener({}).handleDispatch(
        async () => Promise.resolve(),
        {
          before: bruce,
          after: bruce,
          targetLanguage: 'es',
        } as never
      )
    );

    expect(await connectionsOf()).toEqual(['bruce', 'robin']);
  });

  it('should resolve the references in the target language, where the related entities exist', async () => {
    await testingEnvironment.setUp({
      ...fixtures,
      entities: [
        ...factory.entityInMultipleLanguages(['en', 'es'], 'bruce', 'Person'),
        ...factory.entityInMultipleLanguages(['en'], 'robin', 'Person'),
      ],
    });
    const payload: EntityUpdatedEventPayload = {
      before: bruce,
      after: bruce,
      targetLanguage: 'en',
      changedLanguages: ['es', 'en'],
    };

    await testingEnvironment.runWithContext(async () =>
      new ProcessRelationshipAfterEntityUpdatedListener({}).handleDispatch(
        async () => Promise.resolve(),
        payload as never
      )
    );

    expect(await connectionsOf()).toEqual(['bruce', 'robin']);
  });
});
