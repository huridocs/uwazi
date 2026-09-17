import { Template } from '#api/core/domain/template/Template.js';
import { TitleProperty } from '#api/core/domain/template/TitleProperty.js';
import { CreationDateProperty } from '#api/core/domain/template/CreationDateProperty.js';
import { ModifiedDateProperty } from '#api/core/domain/template/ModifiedDateProperty.js';
import { PropertyAssignment } from '#api/core/domain/template/PropertyValue.js';
import { EntityDTO } from '#api/core/domain/entity/EntityDTO.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { EntityUpdatedEventPayload } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { DenormalizeEntityUpdatedListener } from '../DenormalizeEntityUpdatedListener.js';

const templateId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
const translationId = 'bbbbbbbbbbbbbbbbbbbbbbbb';
const titlePropertyId = 'cccccccccccccccccccccccc';
const creationDatePropertyId = 'dddddddddddddddddddddddd';
const modifiedDatePropertyId = 'eeeeeeeeeeeeeeeeeeeeeeee';

const createTemplate = () =>
  new Template(
    templateId,
    'Template',
    [],
    [
      new TitleProperty({ id: titlePropertyId, template: templateId, label: 'Title' }),
      new CreationDateProperty({
        id: creationDatePropertyId,
        template: templateId,
        label: 'Creation date',
      }),
      new ModifiedDateProperty({
        id: modifiedDatePropertyId,
        template: templateId,
        label: 'Modified date',
      }),
    ]
  );

const entityParams: EntityDTO = {
  sharedId: 'entity1',
  templateId,
  translations: [
    {
      id: translationId,
      language: 'en' as LanguageISO6391,
      metadata: {
        title: {
          name: 'title',
          type: 'text',
          value: [{ value: 'Entity 1' }],
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
      },
    },
  ],
};

const params: EntityUpdatedEventPayload = {
  before: entityParams,
  after: entityParams,
  targetLanguage: 'en',
  changedLanguages: ['en'],
};

const inLanguages = (languages: LanguageISO6391[]): EntityDTO => ({
  ...entityParams,
  translations: languages.map((language, index) => ({
    ...entityParams.translations[0],
    id: `${index}`.repeat(24),
    language,
  })),
});

const createSut = (denormalizeRelated = jest.fn()) => {
  const listener = new DenormalizeEntityUpdatedListener({
    templatesDS: {
      getByIds: jest.fn().mockResolvedValue([createTemplate(), createTemplate()]),
    } as never,
    denormalizeRelated: denormalizeRelated as never,
  });
  return { listener, denormalizeRelated };
};

describe('DenormalizeEntityUpdatedListener', () => {
  beforeEach(() => {
    testingTenants.mockCurrentTenant({ name: 'tenant', dbName: 'db', indexName: 'index' });
  });

  it('should be a no-op when postgresCore is active', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore: true } });
    const { listener, denormalizeRelated } = createSut();

    await listener.handle(jest.fn() as never, params, {} as never);

    expect(denormalizeRelated).not.toHaveBeenCalled();
  });

  it('should denormalize related entities when postgresCore is not active', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: {} });
    const { listener, denormalizeRelated } = createSut();

    await listener.handle(jest.fn() as never, params, {} as never);

    expect(denormalizeRelated).toHaveBeenCalledTimes(1);
  });

  it('should denormalize each changed language', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: {} });
    const { listener, denormalizeRelated } = createSut();
    const heartbeat = jest.fn();
    const entity = inLanguages(['en', 'es', 'pt']);

    await listener.handle(
      heartbeat as never,
      { before: entity, after: entity, targetLanguage: 'en', changedLanguages: ['en', 'pt'] },
      {} as never
    );

    expect(
      denormalizeRelated.mock.calls.map(([after, , before]) => [after.language, before.language])
    ).toEqual([
      ['en', 'en'],
      ['pt', 'pt'],
    ]);
    expect(heartbeat).toHaveBeenCalled();
  });

  it('should denormalize the target language of an event queued before changedLanguages existed', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: {} });
    const { listener, denormalizeRelated } = createSut();
    const entity = inLanguages(['en', 'es']);

    await listener.handle(
      jest.fn() as never,
      { before: entity, after: entity, targetLanguage: 'es' } as never,
      {} as never
    );

    expect(denormalizeRelated.mock.calls.map(([after]) => after.language)).toEqual(['es']);
  });
});
