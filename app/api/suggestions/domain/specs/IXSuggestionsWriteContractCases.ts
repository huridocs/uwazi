import db from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { IXSuggestionStateType, IXSuggestionType } from '#shared/types/suggestionType.js';
import { IXSuggestionsDataSource, Suggestion } from '../IXSuggestionsDataSource.js';
import { comparable, extractors, f, suggestions } from './IXSuggestionsContractFixtures.js';

type Sut = () => IXSuggestionsDataSource;

const { accepted, blank, obsolete, pending, spanish, stateless } = suggestions;

const template = f.idString('template');

/** A complete text-source suggestion, as the callers of the write methods build them. */
const newSuggestion = (entityId: string, props: Partial<IXSuggestionType> = {}) => ({
  extractorId: extractors.text,
  entityId,
  entityTemplate: template,
  propertyName: 'text_property',
  language: 'en',
  suggestedValue: '',
  ...props,
});

const reload = async (sut: Sut, ...list: Suggestion[]) =>
  comparable(await sut().getByIds(list.map(({ _id }) => _id)));

/** The fixture suggestions still stored; deleted ones are simply not found. */
const remaining = async (sut: Sut) => reload(sut, ...Object.values(suggestions));

const saveCases = (sut: Sut) => {
  describe('saveMultiple()', () => {
    it('should merge only the given fields into existing rows and return the saved rows', async () => {
      const saved = await sut().saveMultiple([
        { _id: accepted._id, suggestedValue: 'changed', date: 2000 },
      ]);

      const expected = comparable([{ ...accepted, suggestedValue: 'changed', date: 2000 }]);
      expect(comparable(saved)).toEqual(expected);
      expect(await reload(sut, accepted)).toEqual(expected);
    });

    it('should insert the rest with the insert defaults, with or without a given id', async () => {
      const saved = await sut().saveMultiple([
        { _id: blank._id, suggestedValue: ['a', 'b'] },
        newSuggestion('brand-new'),
        { ...newSuggestion('given-id'), _id: f.id('given id'), status: 'ready' },
      ]);

      expect(comparable(saved)).toEqual(
        comparable(await sut().getByIds(saved.map(({ _id }) => _id)))
      );
      expect(comparable(saved)).toEqual(
        comparable([
          { ...blank, suggestedValue: ['a', 'b'] },
          {
            ...newSuggestion('brand-new'),
            _id: saved.find(({ entityId }) => entityId === 'brand-new')!._id,
            status: 'processing',
            useForTraining: false,
          },
          {
            ...newSuggestion('given-id'),
            _id: f.id('given id'),
            status: 'ready',
            useForTraining: false,
          },
        ])
      );
    });

    it('should save nothing when given nothing', async () => {
      expect(await sut().saveMultiple([])).toEqual([]);
    });
  });

  describe('createMultiple()', () => {
    it('should insert with the insert defaults, keeping the values the caller provided', async () => {
      await sut().createMultiple([
        newSuggestion('defaulted'),
        newSuggestion('explicit', { status: 'ready', useForTraining: true }),
      ]);

      const query = (entityId: string) => ({
        extractorId: extractors.text,
        entityId,
        language: 'en',
      });
      expect(await sut().getOneForEntity(query('defaulted'))).toMatchObject({
        status: 'processing',
        useForTraining: false,
      });
      expect(await sut().getOneForEntity(query('explicit'))).toMatchObject({
        status: 'ready',
        useForTraining: true,
      });
    });
  });
};

const stateCases = (sut: Sut) => {
  describe('markObsoleteForExtractor()', () => {
    it("should mark every suggestion of the extractor obsolete, keeping the state's other flags", async () => {
      await sut().markObsoleteForExtractor(extractors.text);

      expect(await reload(sut, accepted, stateless, suggestions.pdfFile1)).toEqual(
        comparable([
          { ...accepted, state: { ...accepted.state!, obsolete: true, match: null } },
          { ...stateless, state: { obsolete: true, match: null } },
          suggestions.pdfFile1,
        ])
      );
    });
  });

  describe('markProcessingAsFailed()', () => {
    it('should fail only the processing suggestions of the extractor', async () => {
      await sut().markProcessingAsFailed(extractors.text, 'boom');

      const failed = {
        processing: false,
        error: true,
        match: null,
        withSuggestion: false,
        hasContext: false,
      };
      expect(await reload(sut, pending, stateless, accepted)).toEqual(
        comparable([
          { ...pending, status: 'failed', error: 'boom', state: { ...pending.state!, ...failed } },
          { ...stateless, status: 'failed', error: 'boom', state: failed },
          accepted,
        ])
      );
    });
  });

  describe('markProcessingAsObsolete()', () => {
    it('should release only the processing suggestions of the extractor as obsolete', async () => {
      await sut().markProcessingAsObsolete(extractors.text);

      const released = { processing: false, obsolete: true, match: null };
      expect(await reload(sut, pending, accepted)).toEqual(
        comparable([
          { ...pending, status: 'ready', state: { ...pending.state!, ...released } },
          accepted,
        ])
      );
    });
  });

  describe('setStates()', () => {
    it('should replace the state of the given suggestions whole, and nothing else', async () => {
      await sut().setStates([
        { id: pending._id, state: { labeled: true, match: true } as IXSuggestionStateType },
        { id: stateless._id, state: { labeled: false } as IXSuggestionStateType },
      ]);
      await sut().setStates([]);

      expect(await reload(sut, pending, stateless, accepted)).toEqual(
        comparable([
          { ...pending, state: { labeled: true, match: true } },
          { ...stateless, state: { labeled: false } },
          accepted,
        ])
      );
    });
  });
};

const trainingCases = (sut: Sut) => {
  describe('setUseForTraining()', () => {
    it('should flag only the given suggestions', async () => {
      await sut().setUseForTraining([blank._id, spanish._id], true);
      await sut().setUseForTraining([accepted._id], false);

      expect(await reload(sut, blank, spanish, accepted, suggestions.pdfFile1)).toEqual(
        comparable([
          { ...blank, useForTraining: true },
          { ...spanish, useForTraining: true },
          { ...accepted, useForTraining: false },
          suggestions.pdfFile1,
        ])
      );
    });
  });

  describe('clearTrainingSamplesForExtractor() and markTrainingSamples()', () => {
    it("should reset the extractor's samples, then mark those of the given entities", async () => {
      await sut().clearTrainingSamplesForExtractor(extractors.text);
      await sut().markTrainingSamples(extractors.text, ['entity1', 'entity2']);

      expect(await reload(sut, accepted, spanish, blank, obsolete, suggestions.pdfFile1)).toEqual(
        comparable([
          { ...accepted, trainingSample: true },
          { ...spanish, trainingSample: true },
          { ...blank, trainingSample: true },
          { ...obsolete, trainingSample: false },
          suggestions.pdfFile1,
        ])
      );
    });
  });
};

const deleteCases = (sut: Sut) => {
  describe('deletes', () => {
    const allExcept = (...deleted: Suggestion[]) =>
      comparable(Object.values(suggestions).filter(suggestion => !deleted.includes(suggestion)));

    it('should delete by extractor', async () => {
      await sut().deleteByExtractorId(extractors.pdf);
      expect(await remaining(sut)).toEqual(allExcept(suggestions.pdfFile1, suggestions.pdfFile2));

      await sut().deleteByExtractorIds([extractors.text, extractors.other]);
      expect(await remaining(sut)).toEqual([]);
    });

    it('should delete by template within the given extractors only', async () => {
      await sut().deleteByTemplatesAndExtractors([f.idString('other template')], [extractors.text]);
      await sut().deleteByTemplatesAndExtractors([template], [extractors.other]);

      expect(await remaining(sut)).toEqual(allExcept(suggestions.otherExtractor));
    });

    it('should delete by file', async () => {
      await sut().deleteByFileIds([f.id('file 1')]);

      expect(await remaining(sut)).toEqual(allExcept(suggestions.pdfFile1));
    });

    it('should delete by entity, and by entity within a template', async () => {
      await sut().deleteByEntityAndTemplate('entity2', f.idString('other template'));
      await sut().deleteByEntityAndTemplate('entity2', template);
      await sut().deleteByEntityId('entity1');

      expect(await remaining(sut)).toEqual(
        allExcept(blank, accepted, spanish, suggestions.otherExtractor)
      );
    });
  });
};

/**
 * Information extraction data is not synced between instances, so no IX write may leave an
 * `updatelogs` row behind, on either backend.
 */
const syncLogCases = (sut: Sut) => {
  describe('sync logging', () => {
    it('should not record sync logs on insert, update or delete', async () => {
      await sut().createMultiple([newSuggestion('new')]);
      await sut().saveMultiple([{ _id: accepted._id, suggestedValue: 'changed' }]);
      await sut().markObsoleteForExtractor(extractors.text);
      await sut().setStates([{ id: pending._id, state: accepted.state! }]);
      await sut().deleteByEntityId('entity1');

      expect(await db.mongodb!.collection('updatelogs').find().toArray()).toEqual([]);
    });
  });
};

/**
 * Fixtures are mirrored into both stores, so every other case would pass against the wrong one.
 * This pins that the factory routes writes to the store the tenant's `postgresCore` flag selects.
 */
const routingCases = (sut: Sut, usePostgres: boolean) => {
  describe('routing', () => {
    it("should write to the tenant's store only", async () => {
      await sut().createMultiple([newSuggestion('routed')]);

      const inPostgres = (await testingPG.getAllFrom('ix_suggestions')).some(
        row => row.entityId === 'routed'
      );
      const inMongo = Boolean(
        await db.mongodb!.collection('ixsuggestions').findOne({ entityId: 'routed' })
      );

      expect({ inPostgres, inMongo }).toEqual({ inPostgres: usePostgres, inMongo: !usePostgres });
    });
  });
};

/** The write half of the IXSuggestionsDataSource contract suite, with the routing case. */
const writeContractCases = (sut: Sut, usePostgres: boolean) => {
  saveCases(sut);
  stateCases(sut);
  trainingCases(sut);
  deleteCases(sut);
  syncLogCases(sut);
  routingCases(sut, usePostgres);
};

export type { Sut };
export { writeContractCases };
