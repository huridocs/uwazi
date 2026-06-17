import { testingEnvironment } from '#api/utils/testingEnvironment.js';

import { DenormalizeThesaurusEntitiesUseCaseFactory } from '#api/core/infrastructure/factories/DenormalizeThesaurusEntitiesUseCaseFactory.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { EntityUpdatedEvent } from '#api/core/domain/entity/EntityUpdatedEvent.js';
import { TestUtils } from '#api/common.v2/utils/Test.js';
import { factory, fixtures } from './DenormalizeThesaurusEntitiesFixtures.js';

const createSut = () => {
  const { sut, eventEmitter } = testingEnvironment.runWithContext(() => ({
    sut: DenormalizeThesaurusEntitiesUseCaseFactory.default(),
    eventEmitter: ExecutionContext.eventEmitter,
  }));

  return { sut, eventEmitter };
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

  it('should update thesaurus labels on entities', async () => {
    const { sut, eventEmitter } = createSut();

    await sut.execute({
      thesaurusId: factory.id('countries').toString(),
      sharedIds: ['entity_1', 'entity_2', 'entity_3', 'entity_4', 'entity_5'],
    });

    expect(eventEmitter.emit).toHaveBeenCalledWith(expect.any(EntityUpdatedEvent));

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
          select: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA V1' }],
          multiselect: [
            { value: factory.id('thesaurus_2_usa').toString(), label: 'USA V1' },
            { value: factory.id('thesaurus_2_brazil').toString(), label: 'Brazil' },
          ],
        },
      },
      {
        language: 'es',
        sharedId: 'entity_4',
        metadata: {
          select: [{ value: factory.id('thesaurus_2_usa').toString(), label: 'USA ES V1' }],
          multiselect: [
            { value: factory.id('thesaurus_2_usa').toString(), label: 'USA ES V1' },
            { value: factory.id('thesaurus_2_brazil').toString(), label: 'Brazil' },
          ],
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
              inheritedValue: [
                { value: factory.id('thesaurus_2_usa').toString(), label: 'USA V1' },
              ],
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
              inheritedValue: [
                { value: factory.id('thesaurus_2_usa').toString(), label: 'USA ES V1' },
              ],
            },
          ],
        },
      },
    ]);
  });

  it('should remove deleted thesaurus values from entities', async () => {
    const { sut } = createSut();

    await testingEnvironment.db.getCollection('dictionaries')?.updateOne(
      {
        _id: factory.id('thesaurus_2'),
      },
      {
        $set: {
          values: [{ id: factory.id('thesaurus_2_brazil').toString(), label: 'Brazil' }],
        },
      }
    );

    await sut.execute({
      thesaurusId: factory.id('thesaurus_2').toString(),
      sharedIds: ['entity_4', 'entity_5'],
    });

    const after = await testingEnvironment.db.getAllFrom('entities');

    expect(after).toEqual(
      TestUtils.arrayIncludesObjects([
        {
          language: 'en',
          sharedId: 'entity_4',
          metadata: {
            select: [],
            multiselect: [{ value: factory.id('thesaurus_2_brazil').toString(), label: 'Brazil' }],
          },
        },
        {
          language: 'es',
          sharedId: 'entity_4',
          metadata: {
            select: [],
            multiselect: [{ value: factory.id('thesaurus_2_brazil').toString(), label: 'Brazil' }],
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
                type: 'entity',
                inheritedType: 'multiselect',
                inheritedValue: [{ value: expect.any(String), label: 'France V1' }],
              },
            ],
            relationship_to_t3: [
              {
                value: 'entity_4',
                label: 'entity_4',
                type: 'entity',
                inheritedType: 'select',
                inheritedValue: [],
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
                type: 'entity',
                inheritedType: 'multiselect',
                inheritedValue: [{ value: expect.any(String), label: 'France ES V1' }],
              },
            ],
            relationship_to_t3: [
              {
                value: 'entity_4',
                label: 'entity_4',
                type: 'entity',
                inheritedType: 'select',
                inheritedValue: [],
              },
            ],
          },
        },
      ])
    );
  });
});
