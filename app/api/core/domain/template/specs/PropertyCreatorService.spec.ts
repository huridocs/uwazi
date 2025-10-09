import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import { DefaultTransactionManager } from 'api/common.v2/database/data_source_defaults';
import { PropertyCreatorService } from '../propertyCreatorService/PropertyCreatorService';
import { TextProperty } from '../TextProperty';
import { PropertyTypeMismatchError } from '../errors';

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
              type: 'text',
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
              type: 'date',
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
              type: 'date',
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
              type: 'text',
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
              type: 'text',
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
              type: 'text',
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
      templatesDS: DefaultTemplatesDataSource(DefaultTransactionManager()),
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Text',
          type: 'date',
          template: new ObjectId().toString(),
        },
        {}
      )
    ).rejects.toThrow(PropertyTypeMismatchError);
  });

  it('should NOT throw if the Property is unique on the system', async () => {
    const sut = new PropertyCreatorService({
      templatesDS: DefaultTemplatesDataSource(DefaultTransactionManager()),
    });

    await expect(
      sut.create(
        {
          id: new ObjectId().toHexString(),
          label: 'Text Label',
          type: 'text',
          template: templateId.toString(),
        },
        {}
      )
    ).resolves.toBeInstanceOf(TextProperty);
  });

  it('should NOT consider the already created Property as duplicated', async () => {
    const sut = new PropertyCreatorService({
      templatesDS: DefaultTemplatesDataSource(DefaultTransactionManager()),
    });

    await expect(
      sut.create(
        {
          id: prevCreated.toHexString(),
          type: 'text',
          label: 'Previous created',
          name: 'prev_created',
          template: templateId.toString(),
        },
        {}
      )
    ).resolves.toBeInstanceOf(TextProperty);
  });
});
