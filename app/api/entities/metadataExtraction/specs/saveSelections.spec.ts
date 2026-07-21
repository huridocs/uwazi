import { files } from '#api/files/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture, testingDB } from '#api/utils/testing_db.js';
import { savePropertySelections } from '../saveSelections.js';

const file1ID = testingDB.id();
const file2ID = testingDB.id();
const file3ID = testingDB.id();

const fixture: DBFixture = {
  settings: [
    {
      languages: [
        {
          _id: testingDB.id(),
          label: 'English',
          key: 'en',
          default: true,
        },
      ],
    },
  ],
  files: [
    {
      _id: file1ID,
      propertySelections: [
        {
          name: 'property_a',
          selection: { text: 'old text of Property A' },
        },
        { name: 'property_b', selection: { text: 'unchanged text of prop B' } },
      ],
    },
    {
      _id: file2ID,
      propertySelections: [],
    },
    {
      _id: file3ID,
      propertySelections: [
        {
          name: 'title',
          selection: { text: 'document title' },
        },
        { name: 'property1', propertyID: '1', selection: { text: 'document text 1' } },
      ],
    },
  ],
};

describe('savePropertySelections', () => {
  beforeEach(async () => {
    jest.spyOn(files, 'save');
    await testingEnvironment.setUp(fixture);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should not call save if entity has no main file', async () => {
    await savePropertySelections({
      sharedId: 'entityWithNoFile',
      language: 'en',
      propertySelections: {
        fileID: '',
        selections: [{ name: 'Title', selection: { text: 'a selection for testing porpouses' } }],
      },
    });
    expect(files.save).not.toHaveBeenCalled();
  });

  it('should not call save if entity has file, but there are no property selections', async () => {
    await savePropertySelections({
      sharedId: 'anotherEntity',
      language: 'en',
      propertySelections: { fileID: file2ID.toString(), selections: [] },
    });
    expect(files.save).not.toHaveBeenCalled();
  });

  it('should not call save if there is no change to file property selections', async () => {
    await savePropertySelections({
      sharedId: 'entitySharedId',
      propertySelections: {
        fileID: file1ID.toString(),
        selections: [],
      },
      metadata: {
        property_b: [
          {
            value: 'unchanged text of prop B',
          },
        ],
        property_a: [
          {
            value: 'old text of Property A',
          },
        ],
      },
    });
    expect(files.save).not.toHaveBeenCalled();
  });

  it('should update selections stored in the file with the newer ones', async () => {
    await savePropertySelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      propertySelections: {
        fileID: file1ID.toString(),
        selections: [
          { name: 'property_a', selection: { text: 'newer selected text of prop A' } },
          { name: 'property_c', selection: { text: 'new selected text of prop C' } },
        ],
      },
      metadata: {
        property_a: [
          {
            value: 'newer selected text of prop A',
          },
        ],
        property_b: [
          {
            value: 'unchanged text of prop B',
          },
        ],
        property_c: [
          {
            value: 'new selected text of prop C',
          },
        ],
      },
    });
    expect(files.save).toHaveBeenCalledWith({
      _id: file1ID,
      propertySelections: [
        {
          name: 'property_a',
          selection: { text: 'newer selected text of prop A' },
        },
        { name: 'property_c', selection: { text: 'new selected text of prop C' } },
        { name: 'property_b', selection: { text: 'unchanged text of prop B' } },
      ],
    });
  });

  it('should remove selections marked for deletion', async () => {
    await savePropertySelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      title: 'document title',
      propertySelections: {
        fileID: file3ID.toString(),
        selections: [
          {
            name: 'title',
            selection: { text: 'document title' },
            deleteSelection: true,
          },
          {
            name: 'property1',
            propertyID: '1',
            selection: { text: 'updated selection' },
          },
          {
            name: 'property2',
            propertyID: '2',
            selection: { text: 'new selection' },
          },
        ],
      },
      metadata: {
        property1: [
          {
            value: 'updated selection',
          },
        ],
        property2: [
          {
            value: 'new selection',
          },
        ],
      },
    });

    expect(files.save).toHaveBeenCalledWith({
      _id: file3ID,
      propertySelections: [
        {
          name: 'property1',
          propertyID: '1',
          selection: { text: 'updated selection' },
        },
        {
          name: 'property2',
          propertyID: '2',
          selection: { text: 'new selection' },
        },
      ],
    });
  });
});
