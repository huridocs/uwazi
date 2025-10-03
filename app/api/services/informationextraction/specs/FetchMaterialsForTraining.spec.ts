/* eslint-disable max-statements */
import { ObjectId } from 'mongodb';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import { testingTenants } from 'api/utils/testingTenants';
import { IXSuggestionsModel } from 'api/suggestions/IXSuggestionsModel';
import { IXModelsModel } from 'api/services/informationextraction/IXModelsModel';
import { Extractors } from 'api/services/informationextraction/ixextractors';
import { EnforcedWithId } from 'api/odm';
import { IXExtractorType } from 'shared/types/extractorType';
import { factory, fixtures } from './fixtures';
import { getPropertyTrainingEntities, getPdfTrainingProcess } from '../FetchMaterialsForTraining';

describe('FetchMaterialsForTraining selection', () => {
  let extractorProp: EnforcedWithId<IXExtractorType>;
  let extractorPdf: EnforcedWithId<IXExtractorType>;

  const setSamplePolicy = async (
    extractorId: ObjectId,
    samplePolicy: 'only_marked' | 'marked_plus_labeled'
  ) => {
    await IXModelsModel.db.updateOne(
      { extractorId },
      { $set: { 'processRun.samplePolicy': samplePolicy } }
    );
  };

  const markUseForTraining = async (criteria: any) => {
    await IXSuggestionsModel.updateMany(criteria, { $set: { useForTraining: true } });
  };

  beforeAll(async () => {
    await testingEnvironment.setUp(fixtures);
    testingTenants.changeCurrentTenant({ name: 'tenant1' });
    // Load extractors used by tests
    [extractorProp] = await Extractors.get({ _id: factory.id('prop1extractor') });
    [extractorPdf] = await Extractors.get({ _id: factory.id('prop1extractor') });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('Property selection', () => {
    it('should include marked entities (including unlabeled) and dedupe; only_marked gates Stage B', async () => {
      const extractorId = extractorProp._id as ObjectId;

      // Mark A3 (unlabeled for property1 in fixtures) and A1
      await markUseForTraining({ extractorId, entityId: { $in: ['A3', 'A1'] } });
      await setSamplePolicy(extractorId, 'only_marked');

      const entitiesOnlyMarked = await getPropertyTrainingEntities(extractorProp);
      const keysOnlyMarked = entitiesOnlyMarked.map(e => `${e.sharedId}::${e.language}`);
      // Should contain both A3 and A1 (languages present in fixtures: en and other)
      expect(keysOnlyMarked.find(k => k.startsWith('A3::'))).toBeTruthy();
      expect(keysOnlyMarked.find(k => k.startsWith('A1::'))).toBeTruthy();

      // With marked_plus_labeled, should include at least the same Stage A plus more or equal
      await setSamplePolicy(extractorId, 'marked_plus_labeled');
      const entitiesPlus = await getPropertyTrainingEntities(extractorProp);
      const setOnly = new Set(keysOnlyMarked);
      const setPlus = new Set(entitiesPlus.map(e => `${e.sharedId}::${e.language}`));
      // No duplicates
      expect(setPlus.size).toBe(entitiesPlus.length);
      // Superset or equal
      // eslint-disable-next-line jest/no-conditional-expect
      expect([...setOnly].every(k => setPlus.has(k))).toBe(true);
    });
  });

  describe('PDF selection', () => {
    it('should yield Stage A files first, skip non-ready XML, and gate Stage B by only_marked', async () => {
      const extractorId = extractorPdf._id as ObjectId;

      // Mark F1 (ready segmentation) and F6 (processing segmentation) to validate skip
      await markUseForTraining({
        extractorId,
        fileId: { $in: [factory.id('F1'), factory.id('F6')] },
      });

      await setSamplePolicy(extractorId, 'only_marked');
      const { process: processOnlyMarked } = await getPdfTrainingProcess(extractorPdf);
      const yieldedOnly: string[] = [];
      await processOnlyMarked(async file => {
        yieldedOnly.push((file._id as ObjectId).toString());
      });

      // Should include F1, and not include F6 (no ready segmentation)
      expect(yieldedOnly).toContain(factory.id('F1').toString());
      expect(yieldedOnly).not.toContain(factory.id('F6').toString());

      // Now allow Stage B and ensure Stage A appears first and no duplicates
      await setSamplePolicy(extractorId, 'marked_plus_labeled');
      const { process } = await getPdfTrainingProcess(extractorPdf);
      const yielded: string[] = [];
      await process(async file => {
        yielded.push((file._id as ObjectId).toString());
      });

      // Stage A (F1) should be first in the sequence
      expect(yielded[0]).toBe(factory.id('F1').toString());
      // No duplicates
      expect(new Set(yielded).size).toBe(yielded.length);
    });
  });
});
