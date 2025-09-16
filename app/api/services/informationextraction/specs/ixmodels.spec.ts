import { Suggestions } from 'api/suggestions/suggestions';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { toHaveBeenCalledBefore } from 'jest-extended';
import { ModelStatus } from 'shared/types/IXModelSchema';
import { LanguageISO6391 } from 'shared/types/commonTypes';
import ixmodels from '../ixmodels';

expect.extend({ toHaveBeenCalledBefore });

const fixtureFactory = getFixturesFactory();

describe('save()', () => {
  const fixtures = {
    settings: [{ languages: [{ default: true, label: 'English', key: 'en' as LanguageISO6391 }] }],
    ixextractors: [fixtureFactory.ixExtractor('extractor', 'target_text', ['template'])],
  };

  const model = fixtureFactory.ixModel('model', 'extractor');
  model.processRun = { suggestionsRunTimestamp: 1 };
  model.processRun.findSuggestionsSharedIds = ['entity1', 'entity2'];

  const fixturesWithModel = {
    ...fixtures,
    ixmodels: [model],
  };

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should set suggestions obsolete on saving a ready model', async () => {
    const setSpy = jest.spyOn(Suggestions, 'setObsolete');

    await ixmodels.saveAndObsoleteSuggestions({
      extractorId: fixtureFactory.id('extractor'),
      creationDate: 5,
      status: ModelStatus.processing,
    });

    expect(setSpy).not.toHaveBeenCalled();

    await ixmodels.saveAndObsoleteSuggestions({
      extractorId: fixtureFactory.id('extractor'),
      creationDate: 5,
      status: ModelStatus.ready,
    });

    expect(setSpy).toHaveBeenCalledWith({ extractorId: fixtureFactory.id('extractor') });

    setSpy.mockRestore();
  });

  describe('additional methods', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixturesWithModel);
    });
    describe('startTraining', () => {
      // TODO: test that the model is updated with the new values
      it('should unset findSuggestionsRunTimestamp and findSuggestionsSharedIds', async () => {
        await ixmodels.startTraining(fixtureFactory.id('extractor'));

        const [updatedModel] = await ixmodels.get({ extractorId: fixtureFactory.id('extractor') });

        expect(updatedModel.processRun?.suggestionsRunTimestamp).toBeUndefined();
        expect(updatedModel.processRun?.findSuggestionsSharedIds).toBeUndefined();
      });
    });

    describe('stopTraining', () => {
      // TODO: test that the model is updated with the new values
      it('should unset findSuggestionsRunTimestamp and findSuggestionsSharedIds', async () => {
        await ixmodels.stopTraining(fixtureFactory.id('extractor'));

        const [updatedModel] = await ixmodels.get({ extractorId: fixtureFactory.id('extractor') });

        expect(updatedModel.processRun?.suggestionsRunTimestamp).toBeUndefined();
        expect(updatedModel.processRun?.findSuggestionsSharedIds).toBeUndefined();
      });
    });

    describe('unsetFindSuggestionsData', () => {
      it('should unset findSuggestionsRunTimestamp and findSuggestionsSharedIds', async () => {
        await ixmodels.unsetFindSuggestionsData(model._id!);

        const [updatedModel] = await ixmodels.get({ extractorId: fixtureFactory.id('extractor') });

        expect(updatedModel.processRun?.suggestionsRunTimestamp).toBeUndefined();
        expect(updatedModel.processRun?.findSuggestionsSharedIds).toBeUndefined();
      });
    });
  });
});
