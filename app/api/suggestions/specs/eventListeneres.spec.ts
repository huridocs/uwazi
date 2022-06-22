/* eslint-disable max-statements */

import entities from 'api/entities';
import fixtures, { batmanFinishesId } from 'api/entities/specs/fixtures';
import { applicationEventsBus } from 'api/eventsbus';
import db from 'api/utils/testing_db';
import { search } from 'api/search';
import { EntityUpdatedEvent } from 'api/entities/events/EntityUpdatedEvent';
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

    const doc = {
      _id: batmanFinishesId,
      sharedId: 'shared',
      title: 'Batman finishes in other words',
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
