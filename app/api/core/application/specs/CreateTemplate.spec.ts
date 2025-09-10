import { DefaultTemplatesDataSource } from 'api/templates.v2/database/data_source_defaults';
import {
  DefaultIdGenerator,
  DefaultTransactionManager,
} from 'api/common.v2/database/data_source_defaults';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { ObjectId } from 'mongodb';
import { TemplateWithDuplicatedNameOnTheSystemError } from 'api/core/domain/template/errors';
import { MongoThesauriDataSource } from 'api/core/infrastructure/mongodb/thesauri/MongoThesauriDS';
import { CreateTemplateUseCase } from '../CreateTemplate';

const createSut = () => {
  const transactionManager = DefaultTransactionManager();
  const templatesDS = DefaultTemplatesDataSource(transactionManager);
  const idGenerator = DefaultIdGenerator;

  const sut = new CreateTemplateUseCase({
    templatesDS,
    idGenerator,
    thesauriDS: new MongoThesauriDataSource(),
  });

  return { sut };
};

const thesaurusId = new ObjectId();

describe('CreateTemplateUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({
      dictionaries: [
        {
          _id: thesaurusId,
          name: 'Fruits',
          values: [
            {
              label: 'Apple',
              id: 'ba0df33d-ab09-46be-9080-00575d0804d0',
            },
            {
              label: 'Banana',
              id: 'a4572c2b-502b-4d97-b706-4fcaceba1a31',
            },
            {
              label: 'Pineapple',
              id: '70c6493b-3aaa-4b03-a1ef-fc8a8bdd082d',
            },
          ],
          __v: 0,
        },
      ],
    });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should create a Template', async () => {
    const { sut } = createSut();

    await sut.execute({
      name: 'Template Name',
      properties: [
        { label: 'Text', type: 'text' },
        { label: 'Date', type: 'date' },
        { label: 'Date Range', type: 'daterange' },
        { label: 'Geolocation', type: 'geolocation' },
        { label: 'Image', type: 'image' },
        { label: 'Link', type: 'link' },
        { label: 'Markdown', type: 'markdown' },
        { label: 'Media', type: 'media' },
        { label: 'Multi Date', type: 'multidate' },
        { label: 'Multi Date Range', type: 'multidaterange' },
        { label: 'Numeric', type: 'numeric' },
        { label: 'Preview', type: 'preview' },
        { label: 'Generated Id', type: 'generatedid' },
        { label: 'Select', type: 'select', content: thesaurusId.toHexString() },
        { label: 'Multi Select', type: 'multiselect', content: thesaurusId.toHexString() },
        // { label: 'New Relationship', type: 'newRelationship' }, // missing
        // { label: 'Nested', type: 'nested' }, // missing
        // { label: 'Relationship', type: 'relationship' }, // missing
      ],
      commonProperties: [
        { label: 'Title', type: 'text', name: 'title', isCommonProperty: true },
        { label: 'Creation Date', type: 'date', name: 'creationDate', isCommonProperty: true },
        { label: 'Edit Date', type: 'date', name: 'editDate', isCommonProperty: true },
      ],
      color: '#142134',
    });

    const templates = await testingEnvironment.db.getAllFrom('templates');

    expect(templates).toEqual([
      {
        _id: expect.any(ObjectId),
        color: '#142134',
        name: 'Template Name',
        default: false,
        commonProperties: [
          {
            _id: expect.any(ObjectId),
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
            _id: expect.any(ObjectId),
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
            _id: expect.any(ObjectId),
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
            _id: expect.any(ObjectId),
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
            _id: expect.any(ObjectId),
            type: 'date',
            label: 'Date',
            name: 'date',
            noLabel: false,
            required: false,
            showInCard: false,
            filter: false,
            defaultfilter: false,
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'daterange',
            label: 'Date Range',
            name: 'date_range',
            noLabel: false,
            required: false,
            showInCard: false,
            filter: false,
            defaultfilter: false,
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'geolocation',
            label: 'Geolocation',
            name: 'geolocation_geolocation',
            noLabel: false,
            required: false,
            showInCard: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'image',
            label: 'Image',
            name: 'image',
            noLabel: false,
            required: false,
            showInCard: false,
            style: 'cover',
            fullWidth: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'link',
            label: 'Link',
            name: 'link',
            noLabel: false,
            required: false,
            showInCard: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'markdown',
            label: 'Markdown',
            name: 'markdown',
            noLabel: false,
            required: false,
            showInCard: false,
            filter: false,
            defaultfilter: false,
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'media',
            label: 'Media',
            name: 'media',
            noLabel: false,
            required: false,
            showInCard: false,
            style: 'cover',
            fullWidth: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'multidate',
            label: 'Multi Date',
            name: 'multi_date',
            noLabel: false,
            required: false,
            showInCard: false,
            filter: false,
            defaultfilter: false,
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'multidaterange',
            label: 'Multi Date Range',
            name: 'multi_date_range',
            noLabel: false,
            required: false,
            showInCard: false,
            filter: false,
            defaultfilter: false,
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'numeric',
            label: 'Numeric',
            name: 'numeric',
            noLabel: false,
            required: false,
            showInCard: false,
            filter: false,
            defaultfilter: false,
            prioritySorting: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'preview',
            label: 'Preview',
            name: 'preview',
            noLabel: false,
            required: false,
            showInCard: false,
            style: 'cover',
            fullWidth: false,
          },
          {
            _id: expect.any(ObjectId),
            label: 'Generated Id',
            type: 'generatedid',
            name: 'generated_id',
            defaultfilter: false,
            filter: false,
            noLabel: false,
            prioritySorting: false,
            required: false,
            showInCard: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'select',
            label: 'Select',
            name: 'select',
            content: thesaurusId.toHexString(),
            defaultfilter: false,
            filter: false,
            noLabel: false,
            prioritySorting: false,
            required: false,
            showInCard: false,
          },
          {
            _id: expect.any(ObjectId),
            type: 'multiselect',
            name: 'multi_select',
            label: 'Multi Select',
            content: thesaurusId.toHexString(),
            defaultfilter: false,
            filter: false,
            noLabel: false,
            prioritySorting: false,
            required: false,
            showInCard: false,
          },
        ],
      },
    ]);
  });

  it('should throw if Template name is not unique on the system', async () => {
    await testingEnvironment.setFixtures({
      templates: [
        {
          color: '#142134',
          name: 'Template Name',
          default: false,
          commonProperties: [
            {
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
          ],
        },
      ],
    });

    const { sut } = createSut();

    await expect(
      sut.execute({
        name: 'Template Name',
        properties: [{ label: 'Text2', type: 'text' }],
        commonProperties: [
          { label: 'Title', type: 'text', name: 'title', isCommonProperty: true },
          { label: 'Creation Date', type: 'date', name: 'creationDate', isCommonProperty: true },
          { label: 'Edit Date', type: 'date', name: 'editDate', isCommonProperty: true },
        ],
        color: '#142134',
      })
    ).rejects.toThrow(TemplateWithDuplicatedNameOnTheSystemError);

    const templates = await testingEnvironment.db.getAllFrom('templates');

    expect(templates).toHaveLength(1);
  });
});
