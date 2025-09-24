/* eslint-disable max-statements */
import testingDB from 'api/utils/testing_db';
import { Db, ObjectId } from 'mongodb';
import migration from '../index';
import { TemplateSchema } from '../types';

describe('migration test', () => {
  let db: Db;

  beforeAll(async () => {
    jest.spyOn(process.stdout, 'write').mockImplementation((_str: string | Uint8Array) => true);

    await testingDB.setupFixturesAndContext({});
    db = testingDB.mongodb!;
  });

  afterAll(async () => {
    await testingDB.tearDown();
  });

  it('should have a delta number', () => {
    expect(migration.delta).toBe(177);
  });

  it('should create missing Common Properties if not present', async () => {
    const t1 = new ObjectId();
    const t2 = new ObjectId();
    const t3 = new ObjectId();
    const t4 = new ObjectId();
    const t5 = new ObjectId();

    const templates: TemplateSchema[] = [
      {
        _id: t1,
        name: 't1',
        commonProperties: [] as any,
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        default: false,
        color: '1',
        __v: 0,
      },
      {
        _id: t2,
        name: 't2',
        commonProperties: [
          {
            _id: new ObjectId(),
            name: 'creationDate',
            label: 'Date added',
            type: 'date',
          },
        ],
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        default: false,
        __v: 0,
      },
      {
        _id: t3,
        name: 't3',
        commonProperties: [
          {
            _id: new ObjectId(),
            name: 'editDate',
            label: 'Date modified',
            type: 'date',
          },
        ],
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        default: false,
        __v: 0,
      },
      {
        _id: t4,
        name: 't4',
        commonProperties: [
          {
            _id: new ObjectId(),
            name: 'title',
            label: 'Title',
            type: 'text',
          },
        ],
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        default: false,
        __v: 0,
      },
      {
        _id: t5,
        name: 't5',
        commonProperties: [
          {
            _id: new ObjectId(),
            name: 'title',
            label: 'Title',
            type: 'text',
            isCommonProperty: true,
          },
          {
            _id: new ObjectId(),
            name: 'creationDate',
            label: 'Date added',
            type: 'date',
            isCommonProperty: true,
          },
          {
            _id: new ObjectId(),
            name: 'editDate',
            label: 'Date modified',
            type: 'date',
            isCommonProperty: true,
          },
        ],
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        default: true,
        __v: 0,
      },
    ];

    await testingDB.mongodb?.collection('templates').insertMany(templates);

    await migration.up(db);

    const editedTemplates = await testingDB.mongodb?.collection('templates').find({}).toArray();

    expect(editedTemplates).toMatchObject([
      {
        _id: t1,
        name: 't1',
        default: false,
        color: '1',
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        __v: 1,
      },
      {
        _id: t2,
        name: 't2',
        default: false,
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        __v: 1,
      },
      {
        _id: t3,
        name: 't3',
        default: false,
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        __v: 1,
      },
      {
        _id: t4,
        name: 't4',
        default: false,
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        __v: 1,
      },
      {
        _id: t5,
        name: 't5',
        default: true,
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        __v: 0,
      },
    ]);

    editedTemplates?.forEach(template =>
      expect(template.commonProperties).toEqual([
        {
          _id: expect.any(ObjectId),
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: expect.any(ObjectId),
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: expect.any(ObjectId),
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ])
    );
  });

  it('should replace wrong Common Properties name by the correct ones', async () => {
    const templates: TemplateSchema[] = [
      {
        _id: new ObjectId(),
        name: 't1',
        commonProperties: [
          {
            _id: new ObjectId(),
            name: 'date_added',
            label: 'Date added',
            type: 'date',
          },
        ],
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        default: false,
        __v: 0,
      },
      {
        _id: new ObjectId(),
        name: 't2',
        commonProperties: [
          {
            _id: new ObjectId(),
            name: 'date_modified',
            label: 'Date modified',
            type: 'date',
          },
        ],
        properties: [{ label: 'Text', type: 'text', name: 'text' }],
        default: false,
        __v: 0,
      },
    ];

    await testingDB.mongodb?.collection('templates').insertMany(templates);

    await migration.up(db);

    const editedTemplates = await testingDB.mongodb?.collection('templates').find({}).toArray();

    editedTemplates?.forEach(template =>
      expect(template.commonProperties).toEqual([
        {
          _id: expect.any(ObjectId),
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: expect.any(ObjectId),
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: expect.any(ObjectId),
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ])
    );
  });
});
