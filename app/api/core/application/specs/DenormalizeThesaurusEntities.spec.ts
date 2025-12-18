import { testingEnvironment } from 'api/utils/testingEnvironment';

import { DenormalizeThesaurusEntitiesUseCaseFactory } from 'api/core/infrastructure/factories/DenormalizeThesaurusEntitiesUseCaseFactory';
import { factory, fixtures } from './DenormalizeThesaurusEntitiesFixtures';

const createSut = () => {
  const sut = DenormalizeThesaurusEntitiesUseCaseFactory.default();

  return { sut };
};

describe('DenormalizeThesaurusEntities', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should denormalize localized thesaurus values', async () => {
    const { sut } = createSut();

    await sut.execute({
      sharedIds: ['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5'],
    });

    const after = await testingEnvironment.db.getAllFrom('entities');

    expect(after).toMatchObject([
      {
        language: 'en',
        sharedId: 'entity_1',
        metadata: {
          select: [{ value: factory.id('countries_canada').toString(), label: 'Canada' }],
          multiselect: [{ value: factory.id('countries_france').toString(), label: 'France' }],
          text: [{ value: 'text en' }],
        },
      },
      {
        language: 'es',
        sharedId: 'entity_1',
        metadata: {
          select: [{ value: factory.id('countries_canada').toString(), label: 'Canada' }],
          multiselect: [{ value: factory.id('countries_france').toString(), label: 'France' }],
          text: [{ value: 'text es' }],
        },
      },
      {
        language: 'en',
        sharedId: 'entity_2',
        metadata: {
          select: [],
          multiselect: [{ value: factory.id('countries_france').toString(), label: 'France' }],
          text: [{ value: 'text en' }],
        },
      },
      {
        language: 'es',
        sharedId: 'entity_2',
        metadata: {
          select: [],
          multiselect: [{ value: factory.id('countries_france').toString(), label: 'France' }],
          text: [{ value: 'text es' }],
        },
      },
      {
        language: 'en',
        sharedId: 'entity_3',
        metadata: {
          select: [{ value: factory.id('countries_france').toString(), label: 'France' }],
          relationship_1: [
            {
              value: 'entity_1',
              label: 'entity_1',
              inheritedValue: [
                { value: factory.id('countries_canada').toString(), label: 'Canada' },
              ],
            },
          ],
        },
      },
      {
        language: 'es',
        sharedId: 'entity_3',
        metadata: {
          select: [{ value: factory.id('countries_france').toString(), label: 'France' }],
          relationship_1: [
            {
              value: 'entity_1',
              label: 'entity_1',
              inheritedValue: [
                { value: factory.id('countries_canada').toString(), label: 'Canada' },
              ],
            },
          ],
        },
      },
      {
        language: 'en',
        sharedId: 'entity_4',
        metadata: {
          select: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
          multiselect: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
        },
      },
      {
        language: 'es',
        sharedId: 'entity_4',
        metadata: {
          select: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
          multiselect: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
        },
      },
      {
        language: 'en',
        sharedId: 'entity_5',
        metadata: {
          relationship_to_t1: [
            {
              value: 'entity_1',
              label: 'entity_1',
              inheritedValue: [
                { value: factory.id('countries_france').toString(), label: 'France' },
              ],
            },
          ],
          relationship_to_t3: [
            {
              value: 'entity_4',
              label: 'entity_4',
              inheritedValue: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
            },
          ],
        },
      },
      {
        language: 'es',
        sharedId: 'entity_5',
        metadata: {
          relationship_to_t1: [
            {
              value: 'entity_1',
              label: 'entity_1',
              inheritedValue: [
                { value: factory.id('countries_france').toString(), label: 'France' },
              ],
            },
          ],
          relationship_to_t3: [
            {
              value: 'entity_4',
              label: 'entity_4',
              inheritedValue: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA' }],
            },
          ],
        },
      },
    ]);
  });
});
