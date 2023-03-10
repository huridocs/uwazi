import { Suggestions } from 'api/suggestions/suggestions';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import db from 'api/utils/testing_db';
import { ModelStatus } from 'shared/types/IXModelSchema';
import ixmodels from '../ixmodels';

const fixtureFactory = getFixturesFactory();

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
      extractorId: fixtureFactory.id('extractor'),
      creationDate: 5,
      status: ModelStatus.processing,
    });

    expect(setSpy).not.toHaveBeenCalled();

    await ixmodels.save({
      extractorId: fixtureFactory.id('extractor'),
      creationDate: 5,
      status: ModelStatus.ready,
    });

    expect(setSpy).toHaveBeenCalledWith({ extractorId: fixtureFactory.id('extractor') });

    setSpy.mockRestore();
  });
});
