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

  it('should set suggestions obsolete on saving a ready model', async () => {
    const setSpy = jest.spyOn(Suggestions, 'setObsolete');

    await ixmodels.save({
      propertyName: 'property',
      creationDate: 5,
      status: ModelStatus.processing,
    });

    expect(setSpy).not.toHaveBeenCalled();

    await ixmodels.save({
      propertyName: 'property',
      creationDate: 5,
      status: ModelStatus.ready,
    });

    expect(setSpy).toHaveBeenCalledWith({ propertyName: 'property' });

    setSpy.mockRestore();
  });
});
