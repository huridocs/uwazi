/* eslint-disable max-statements */

import entities from 'api/entities';
import fixtures, { batmanFinishesId } from 'api/entities/specs/fixtures';
import { applicationEventsBus } from 'api/eventsbus';
import db from 'api/utils/testing_db';
import { search } from 'api/search';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
import { EntitySchema } from 'shared/types/entityType';
import { FileUpdatedEvent } from 'api/files/events/FileUpdatedEvent';
import { FileType } from 'shared/types/fileType';
import { FilesDeletedEvent } from 'api/files/events/FilesDeletedEvent';
import { registerEventListeners } from '../eventListeners';
import { Suggestions } from '../suggestions';

// TODO: this needs to use its own fixtures

beforeAll(() => {
  registerEventListeners(applicationEventsBus);
});

beforeEach(async () => {
  spyOn(search, 'indexEntities').and.returnValue(Promise.resolve());
  // @ts-ignore
  await db.setupFixturesAndContext(fixtures);
});

afterAll(async () => {
  await db.disconnect();
});

describe(`On ${EntityUpdatedEvent.name}`, () => {
  it('should update ix suggestions on entity update, if relevant metadata is changed', async () => {
    const updateSpy = jest.spyOn(Suggestions, 'updateStates');

    const doc: EntitySchema = {
      _id: batmanFinishesId,
      sharedId: 'shared',
      title: 'Batman finishes in other words',
      language: 'en',
    };
    const user = { _id: db.id() };
    let saved = await entities.save(doc, { user, language: 'en' });
    expect(updateSpy).not.toHaveBeenCalled();

    let toSave = {
      ...doc,
      metadata: {
        ...saved.metadata,
        text: [{ value: 'new text value' }],
        property1: [{ value: 'new property 1 value' }],
      },
    };
    saved = await entities.save(toSave, { user, language: 'en' });
    expect(updateSpy).not.toHaveBeenCalled();

    toSave = {
      ...doc,
      metadata: {
        ...saved.metadata,
        property2: [{ value: 'new property 2 value' }],
      },
    };
    saved = await entities.save(toSave, { user, language: 'en' });
    expect(updateSpy).toHaveBeenCalledWith({ entityId: saved.sharedId });

    updateSpy.mockClear();
    toSave = {
      ...doc,
      metadata: {
        ...saved.metadata,
        text: [{ value: 'second new text value' }],
        property1: [{ value: 'second new property 1 value' }],
        property2: [{ value: 'second new property 2 value' }],
        description: [{ value: 'new description value' }],
      },
    };
    saved = await entities.save(toSave, { user, language: 'en' });
    expect(updateSpy).toHaveBeenCalledWith({ entityId: saved.sharedId });

    updateSpy.mockRestore();
  });
});

describe(`On ${FileUpdatedEvent.name}`, () => {
  const fileId = db.id();

  const extractedMetadata = {
    extractedMetadata: [
      {
        name: 'propertyName',
        selection: {
          text: 'something',
          selectionRectangles: [{ top: 0, left: 0, width: 0, height: 0, page: '1' }],
        },
      },
    ],
  };

  const original: FileType = {
    _id: fileId,
    creationDate: 1,
    entity: 'sharedId1',
    generatedToc: true,
    originalname: 'upload1',
    type: 'custom',
    language: 'eng',
  };

  it('should not update the ix suggestion state if the extractedMetadata does not change', async () => {
    const updateSpy = jest.spyOn(Suggestions, 'updateStates');

    await applicationEventsBus.emit(new FileUpdatedEvent({ before: original, after: original }));

    expect(updateSpy).not.toHaveBeenCalled();

    updateSpy.mockClear();

    await applicationEventsBus.emit(
      new FileUpdatedEvent({
        before: { ...original, ...extractedMetadata },
        after: { ...original, ...extractedMetadata },
      })
    );

    expect(updateSpy).not.toHaveBeenCalled();
  });

  it('should update ix suggestions if extractedMetada changes', async () => {
    const updateSpy = jest.spyOn(Suggestions, 'updateStates');

    await applicationEventsBus.emit(
      new FileUpdatedEvent({ before: original, after: { ...original, ...extractedMetadata } })
    );

    expect(updateSpy).toHaveBeenCalledWith({ fileId });

    updateSpy.mockClear();

    await applicationEventsBus.emit(
      new FileUpdatedEvent({
        before: { ...original, ...extractedMetadata },
        after: {
          ...original,
          extractedMetadata: [
            { ...extractedMetadata.extractedMetadata[0], name: 'other something' },
          ],
        },
      })
    );

    expect(updateSpy).toHaveBeenCalledWith({ fileId });

    updateSpy.mockClear();

    await applicationEventsBus.emit(
      new FileUpdatedEvent({
        before: { ...original, ...extractedMetadata },
        after: {
          ...original,
          extractedMetadata: [],
        },
      })
    );

    expect(updateSpy).toHaveBeenCalledWith({ fileId });
  });
});

describe(`On ${FilesDeletedEvent.name}`, () => {
  it('should delete all files that triggered the event', async () => {
    const deleteSpy = jest.spyOn(Suggestions, 'delete');

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

    expect(deleteSpy).toHaveBeenCalledWith({ fileId: { $in: [file1Id, file2Id] } });
  });
});
