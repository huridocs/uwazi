/* eslint-disable max-statements */
import { testingEnvironment } from 'api/utils/testingEnvironment';

import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { MongoThesauriDataSourceV2 } from 'api/core/infrastructure/mongodb/thesauri/MongoThesaurusDataSourceV2';
import { getConnection } from 'api/core/infrastructure/mongodb/common/getConnectionForCurrentTenant';
import { DefaultDispatcher } from 'api/core/libs/queue/configuration/factories';
import { tenants } from 'api/tenants';
import { SettingsDataSourceFactory } from 'api/core/infrastructure/factories/SettingsDataSourceFactory';
import { DefaultTranslationsDataSource } from 'api/i18n.v2/database/data_source_defaults';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { UserSchema } from 'shared/types/userType';
import { MongoMultiLanguageEntityDataSource } from 'api/entities.v2/database/MongoMultiLanguageEntityDataSource';
import { ThesaurusTranslationService } from '../thesaurusTranslationService/ThesaurusTranslationService';
import { ThesauriDataSource } from '../contracts/ThesauriDataSource';
import { DenormalizeThesaurusEntitiesUseCase } from '../DenormalizeThesaurusEntities';
import { PropertyAssignmentCreatorServiceStrategy } from '../propertyAssignmentCreatorService/PropertyAssignmentCreatorServiceStrategy';
import { factory, fixtures } from './DenormalizeThesaurusEntitiesFixtures.spec';

type CreateSutProps = {
  thesauriDS?: ThesauriDataSource;
  thesaurusTranslationService?: ThesaurusTranslationService;
  jobsDispatcher?: JobsDispatcher;
};

const createSut = (props?: CreateSutProps) => {
  const tenant = tenants.current();
  const actor: UserSchema = {
    _id: factory.id('user1'),
    username: 'username',
    email: 'email@email.com',
    role: 'admin',
  };

  const transactionManager = TransactionManagerFactory.default();
  const jobsDispatcher =
    props?.jobsDispatcher ?? DefaultDispatcher(tenant.name, transactionManager);

  const entitiesDS = new MongoMultiLanguageEntityDataSource(getConnection(), transactionManager);
  const settingsDS = SettingsDataSourceFactory.default(transactionManager);
  const translationsDS = DefaultTranslationsDataSource(transactionManager);
  const thesauriDS = new MongoThesauriDataSourceV2(getConnection(), transactionManager);

  const propertyAssignmentCreatorServiceStrategy = PropertyAssignmentCreatorServiceStrategy.create({
    entitiesDS,
    settingsDS,
    thesauriDS,
    translationsDS,
  });

  const sut = new DenormalizeThesaurusEntitiesUseCase(
    {
      jobsDispatcher,
      transactionManager,
      entitiesDS,
      propertyAssignmentCreatorServiceStrategy,
    },
    { tenant, actor }
  );

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
