import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { TemplatesDataSourceFactory } from 'api/core/infrastructure/factories/TemplatesDataSourceFactory';
import { TransactionManagerFactory } from 'api/core/infrastructure/factories/TransactionManagerFactory';
import { PropertyTypeEnum } from 'api/core/domain/template/PropertyType';
import { PropertyCreatorService } from '../propertyCreatorService/PropertyCreatorService';
import { TextProperty } from '../../domain/template/TextProperty';
import { PropertyTypeMismatchError } from '../../domain/template/errors';

const prevCreated = new ObjectId();

describe('PropertyCreatorService', () => {
  const templateId = new ObjectId();
  beforeAll(async () => {
    await testingEnvironment.setUp({
      templates: [
        {
          _id: templateId,
          color: '#142134',
          name: 'Template Name',
          default: false,
          commonProperties: [
            {
              _id: new ObjectId(),
              type: PropertyTypeEnum.Text,
              label: 'Title',
              name: 'title',
              isCommonProperty: true,
              noLabel: false,
              required: false,
              showInCard: false,
              generatedId: false,
              prioritySorting: false,
            },
            {
              _id: new ObjectId(),
              type: PropertyTypeEnum.Date,
              label: 'Creation Date',
              name: 'creationDate',
              isCommonProperty: true,
              noLabel: false,
              required: false,
              showInCard: false,
              prioritySorting: false,
            },
            {
              _id: new ObjectId(),
              type: PropertyTypeEnum.Date,
              label: 'Edit Date',
              name: 'editDate',
              isCommonProperty: true,
              noLabel: false,
              required: false,
              showInCard: false,
              prioritySorting: false,
            },
          ],
          properties: [
            {
              _id: new ObjectId(),
              type: PropertyTypeEnum.Text,
              label: 'Text',
              name: 'text',
              noLabel: false,
              required: false,
              showInCard: false,
              generatedId: false,
              filter: false,
              defaultfilter: false,
              prioritySorting: false,
            },
            {
              _id: new ObjectId(),
              type: PropertyTypeEnum.Text,
              label: 'Text',
              name: 'text1',
              noLabel: false,
              required: false,
              showInCard: false,
              generatedId: false,
              filter: false,
              defaultfilter: false,
              prioritySorting: false,
            },

            {
              _id: prevCreated,
              type: PropertyTypeEnum.Text,
              label: 'Previous created',
              name: 'prev_created',
            },
          ],
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should throw if the Property is not consistent', async () => {
    const sut = new PropertyCreatorService({
      templatesDS: TemplatesDataSourceFactory.default(TransactionManagerFactory.default()),
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Text',
          type: PropertyTypeEnum.Date,
          template: new ObjectId().toString(),
        },
        {}
      )
    ).rejects.toThrow(PropertyTypeMismatchError);
  });

  it('should NOT throw if the Property is unique on the system', async () => {
    const sut = new PropertyCreatorService({
      templatesDS: TemplatesDataSourceFactory.default(TransactionManagerFactory.default()),
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Text Label',
          type: PropertyTypeEnum.Text,
          template: templateId.toString(),
        },
        {}
      )
    ).resolves.toBeInstanceOf(TextProperty);
  });

  it('should NOT consider the already created Property as duplicated', async () => {
    const sut = new PropertyCreatorService({
      templatesDS: TemplatesDataSourceFactory.default(TransactionManagerFactory.default()),
    });

    await expect(
      sut.create(
        {
          id: prevCreated.toHexString(),
          type: PropertyTypeEnum.Text,
          label: 'Previous created',
          name: 'prev_created',
          template: templateId.toString(),
        },
        {}
      )
    ).resolves.toBeInstanceOf(TextProperty);
  });
});
