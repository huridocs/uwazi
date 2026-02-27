import { applicationEventsBus } from '#api/core/libs/eventsbus/index.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { FilesDeletedEvent } from '#api/files/events/FilesDeletedEvent.js';
import db from '#api/utils/testing_db.js';
import { registerEventListeners } from '../eventListeners.js';
import { SegmentationModel } from '../segmentationModel.js';

beforeAll(async () => {
  registerEventListeners(applicationEventsBus);
  await testingEnvironment.setUp({});
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe(`On ${FilesDeletedEvent.name}`, () => {
  it('should delete segmentations related to files that triggered the event', async () => {
    const deleteSpy = jest.spyOn(SegmentationModel, 'delete');

    const file1Id = db.id();
    const file2Id = db.id();

    await applicationEventsBus.emit(
      new FilesDeletedEvent({
        files: [
          {
            _id: file1Id,
            creationDate: 1,
            entity: 'sharedId1',
            generatedToc: true,
            originalname: 'upload1',
            type: 'document',
            language: 'eng',
          },
          {
            _id: file2Id,
            creationDate: 1,
            entity: 'sharedId2',
            generatedToc: true,
            originalname: 'upload2',
            type: 'document',
            language: 'eng',
          },
        ],
      })
    );

    expect(deleteSpy).toHaveBeenCalledWith({ fileID: { $in: [file1Id, file2Id] } });
    deleteSpy.mockRestore();
  });
});
