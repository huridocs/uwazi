import { ObjectId } from 'mongodb';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { TemplatesDataSourceFactory } from '#api/core/infrastructure/factories/TemplatesDataSourceFactory.js';
import { TransactionManagerFactory } from '#api/core/infrastructure/factories/TransactionManagerFactory.js';
import { DefaultRelationshipTypesDataSource } from '#api/relationshiptypes.v2/database/data_source_defaults.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { V1RelationshipProperty } from '#api/core/domain/template/V1RelationshipProperty.js';
import { PropertyTypeEnum } from '#api/core/domain/template/PropertyType.js';
import {
  RelationshipTargetPropertyNotFoundError,
  RelationshipTargetTypeMismatchError,
  RelationshipTypeDoesNotExistError,
  TemplateDoesNotExistError,
} from '../../domain/template/errors.js';
import { RelationshipPropertyCreatorService } from '../propertyCreatorService/RelationshipPropertyCreatorService.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { DependenciesContext, ContextDependencies } from '#api/core/libs/DependenciesContext.js';
import { tenants } from '#api/tenants/index.js';

const factory = getFixturesFactory();

const createSut = () => {
  const transactionManger = TransactionManagerFactory.default();

  const sut = new RelationshipPropertyCreatorService({
    templatesDS: TemplatesDataSourceFactory.default(transactionManger),
    relationshipTypesDS: DefaultRelationshipTypesDataSource(transactionManger),
  });

  return { sut };
};

describe('RelationshipPropertyCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});

    const tenant = tenants.current();
    jest.spyOn(DependenciesContext, 'getStore').mockReturnValue({
      instances: {
        elasticClient: ElasticSearchClientFactory.tenantAware(tenant.name),
      },
      factories: {},
    } as ContextDependencies);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should throw if Relation type does not exist', async () => {
    const { sut } = createSut();

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Target Any',
          type: PropertyTypeEnum.Relationship,
          template: '',
          relationType: new ObjectId().toHexString(),
        },
        {}
      )
    ).rejects.toThrow(RelationshipTypeDoesNotExistError);
  });

  it('should throw if Target Template does not exist', async () => {
    const { sut } = createSut();
    const relationTypeId = new ObjectId();

    await testingEnvironment.setFixtures({
      relationtypes: [
        {
          _id: relationTypeId,
          name: 'name',
        },
      ],
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Target Any',
          type: PropertyTypeEnum.Relationship,
          template: '',
          relationType: relationTypeId.toHexString(),
          content: new ObjectId().toHexString(),
          inherit: {
            property: new ObjectId().toHexString(),
            type: PropertyTypeEnum.Date,
          },
        },
        {}
      )
    ).rejects.toThrow(TemplateDoesNotExistError);
  });

  it('should throw if Target Property does not exist', async () => {
    const { sut } = createSut();
    const relationTypeId = new ObjectId();
    const templateId = new ObjectId();

    await testingEnvironment.setFixtures({
      relationtypes: [
        {
          _id: relationTypeId,
          name: 'name',
        },
      ],
      templates: [factory.template('', [], { _id: templateId, name: 'name' })],
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Target Any',
          type: PropertyTypeEnum.Relationship,
          template: '',
          relationType: relationTypeId.toHexString(),
          content: templateId.toHexString(),
          inherit: {
            property: new ObjectId().toHexString(),
            type: PropertyTypeEnum.Date,
          },
        },
        {}
      )
    ).rejects.toThrow(RelationshipTargetPropertyNotFoundError);
  });

  it('should throw if Target Property mismatch', async () => {
    const { sut } = createSut();
    const relationTypeId = new ObjectId();
    const templateId = new ObjectId();
    const propertyId = new ObjectId();

    await testingEnvironment.setFixtures({
      relationtypes: [
        {
          _id: relationTypeId,
          name: 'name',
        },
      ],
      templates: [
        factory.template('', [factory.property('date', 'date', { _id: propertyId })], {
          _id: templateId,
          name: 'name',
        }),
      ],
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Target Any',
          type: PropertyTypeEnum.Relationship,
          template: '',
          relationType: relationTypeId.toHexString(),
          content: templateId.toHexString(),
          inherit: {
            property: propertyId.toHexString(),
            type: PropertyTypeEnum.DateRange,
          },
        },
        {}
      )
    ).rejects.toThrow(RelationshipTargetTypeMismatchError);
  });

  it('should create an instance of Relationship Property', async () => {
    const { sut } = createSut();
    const relationTypeId = new ObjectId();
    const templateId = new ObjectId();
    const propertyId = new ObjectId();

    await testingEnvironment.setFixtures({
      relationtypes: [
        {
          _id: relationTypeId,
          name: 'name',
        },
      ],
      templates: [
        factory.template('', [factory.property('date', 'date', { _id: propertyId })], {
          _id: templateId,
          name: 'name',
        }),
      ],
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Target Any',
          type: PropertyTypeEnum.Relationship,
          template: templateId.toString(),
          relationType: relationTypeId.toHexString(),
          content: templateId.toHexString(),
          inherit: {
            property: propertyId.toHexString(),
            type: PropertyTypeEnum.Date,
          },
        },
        {}
      )
    ).resolves.toBeInstanceOf(V1RelationshipProperty);
  });
});
