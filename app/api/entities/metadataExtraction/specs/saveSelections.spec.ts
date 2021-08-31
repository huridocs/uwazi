import { files } from 'api/files';
import { testingDB } from 'api/utils/testing_db';
import { saveSelections } from '../saveSelections';

const file1ID = testingDB.id();
const file2ID = testingDB.id();

const fixture = {
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
  ],
};

describe('saveSelections', () => {
  jest.spyOn(files, 'save');

  beforeEach(async () => {
    await testingDB.clearAllAndLoad(fixture);
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
});
