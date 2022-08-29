import { applicationEventsBus } from 'api/eventsbus';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import db from 'api/utils/testing_db';
import { registerEventListeners } from '../eventListeners';
import { SegmentationModel } from '../segmentationModel';

beforeAll(async () => {
  registerEventListeners(applicationEventsBus);
  await db.setupFixturesAndContext({});
});

afterAll(async () => {
  await db.disconnect();
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
