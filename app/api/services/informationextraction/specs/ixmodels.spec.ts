import { Suggestions } from 'api/suggestions/suggestions';
import db from 'api/utils/testing_db';
import { ModelStatus } from 'shared/types/IXModelSchema';
import ixmodels from '../ixmodels';

describe('save()', () => {
  beforeAll(async () => {
    await db.clearAllAndLoad({
      settings: [{ languages: [{ default: true, label: 'English', key: 'en' }] }],
    });
  });

  afterAll(async () => {
    await db.disconnect();
  });

  it('should update suggestions on saving a ready model', async () => {
    const updateSpy = jest.spyOn(Suggestions, 'updateStates');

    await ixmodels.save({
      propertyName: 'property',
      creationDate: 5,
      status: ModelStatus.processing,
    });

    expect(updateSpy).not.toHaveBeenCalled();

    await ixmodels.save({
      propertyName: 'property',
      creationDate: 5,
      status: ModelStatus.ready,
    });

    expect(updateSpy).toHaveBeenCalledWith({ propertyName: 'property' });

    updateSpy.mockRestore();
  });
});
