import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { DefaultRelationshipTypesDataSource } from 'api/relationshiptypes.v2/database/data_source_defaults';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { V1RelationshipProperty } from 'api/core/domain/template/V1RelationshipProperty';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import {
  RelationshipTargetPropertyNotFoundError,
  RelationshipTargetTypeMismatchError,
  RelationshipTypeDoesNotExistError,
  TemplateDoesNotExistError,
} from '../../domain/template/errors';
import { RelationshipPropertyCreatorService } from '../propertyCreatorService/RelationshipPropertyCreatorService';

const factory = getFixturesFactory();

const createSut = () => {
  const transactionManger = DefaultTransactionManager();

  const sut = new RelationshipPropertyCreatorService({
    templatesDS: DefaultTemplatesDataSource(transactionManger),
    relationshipTypesDS: DefaultRelationshipTypesDataSource(transactionManger),
  });

  return { sut };
};

describe('RelationshipPropertyCreatorService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({});
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
