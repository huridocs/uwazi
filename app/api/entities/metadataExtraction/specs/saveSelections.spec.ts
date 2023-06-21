import { files } from 'api/files';
import { DBFixture, testingDB } from 'api/utils/testing_db';
import { saveSelections } from '../saveSelections';

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
      extractedMetadata: [
        {
          name: 'property_a',
          selection: { text: 'old text of Property A' },
        },
        { name: 'property_b', selection: { text: 'unchanged text of prop B' } },
      ],
    },
    {
      _id: file2ID,
      extractedMetadata: [],
    },
    {
      _id: file3ID,
      extractedMetadata: [
        {
          name: 'title',
          selection: { text: 'document title' },
        },
        { name: 'property1', propertyID: '1', selection: { text: 'document text 1' } },
      ],
    },
  ],
};

describe('saveSelections', () => {
  beforeEach(async () => {
    jest.spyOn(files, 'save');
    await testingDB.setupFixturesAndContext(fixture);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await testingDB.disconnect();
  });

  it('should not call save if entity has no main file', async () => {
    await saveSelections({
      sharedId: 'entityWithNoFile',
      language: 'en',
      __extractedMetadata: {
        fileID: '',
        selections: [{ name: 'Title', selection: { text: 'a selection for testing porpouses' } }],
      },
    });
    expect(files.save).not.toHaveBeenCalled();
  });

  it('should not call save if entity has file, but there is not extracted metadata', async () => {
    await saveSelections({
      sharedId: 'anotherEntity',
      language: 'en',
      __extractedMetadata: { fileID: file2ID.toString(), selections: [] },
    });
    expect(files.save).not.toHaveBeenCalled();
  });

  it('should not call save if theres no change to files extracted metadata', async () => {
    await saveSelections({
      sharedId: 'entitySharedId',
      __extractedMetadata: {
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
    await saveSelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      __extractedMetadata: {
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
      extractedMetadata: [
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
    await saveSelections({
      _id: 'entityID',
      sharedId: 'entitySharedId',
      title: 'document title',
      __extractedMetadata: {
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
      extractedMetadata: [
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
