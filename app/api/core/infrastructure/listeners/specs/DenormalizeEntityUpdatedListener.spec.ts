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
};

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

  it('should be a no-op when postgresEntities is active', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: { postgresEntities: true } });
    const { listener, denormalizeRelated } = createSut();

    await listener.handle(jest.fn() as never, params, {} as never);

    expect(denormalizeRelated).not.toHaveBeenCalled();
  });

  it('should denormalize related entities when postgresEntities is not active', async () => {
    testingTenants.changeCurrentTenant({ featureFlags: {} });
    const { listener, denormalizeRelated } = createSut();

    await listener.handle(jest.fn() as never, params, {} as never);

    expect(denormalizeRelated).toHaveBeenCalledTimes(1);
  });
});
