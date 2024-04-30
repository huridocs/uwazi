import db from 'api/utils/testing_db';

import {
  EntitySuggestionType,
  IXSuggestionStateType,
  IXSuggestionType,
  IXSuggestionsFilter,
} from 'shared/types/suggestionType';
import { Suggestions } from '../suggestions';
import {
  factory,
  file2Id,
  file3Id,
  fixtures,
  personTemplateId,
  shared2enId,
  shared2esId,
  suggestionId,
  shared2AgeSuggestionId,
  selectAcceptanceFixtureBase,
} from './fixtures';

const getSuggestions = async (filter: IXSuggestionsFilter, size = 5) =>
  Suggestions.get(filter, { page: { size, number: 1 } });

const findOneSuggestion = async (query: any): Promise<IXSuggestionType> =>
  db.mongodb
    ?.collection('ixsuggestions')
    .findOne({ ...query }) as unknown as Promise<IXSuggestionType>;

const stateUpdateCases: {
  state: Partial<IXSuggestionStateType>;
  reason: string;
  suggestionQuery: any;
}[] = [
  {
    state: { obsolete: true },
    reason: 'obsolete, if the suggestion is older than the model',
    suggestionQuery: { entityId: 'shared5', propertyName: 'age' },
  },
  {
    state: {
      withValue: true,
      withSuggestion: false,
      labeled: false,
      match: false,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason: 'if entity value exists, file label is empty, suggestion is empty',
    suggestionQuery: { entityId: 'shared3', propertyName: 'age' },
  },
  {
    state: {
      labeled: true,
      withValue: true,
      withSuggestion: true,
      match: true,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason: 'if file label exists, suggestion and entity value exist and match',
    suggestionQuery: {
      entityId: 'shared2',
      propertyName: 'super_powers',
      language: 'en',
      status: 'ready',
    },
  },
  {
    state: {
      labeled: true,
      withValue: true,
      withSuggestion: true,
      match: true,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason:
      'when property is a date, and if file label exists, suggestion and entity value exist and match',
    suggestionQuery: {
      entityId: 'shared7',
      propertyName: 'first_encountered',
      language: 'es',
    },
  },
  {
    state: {
      labeled: false,
      withValue: false,
      withSuggestion: false,
      match: false,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason: 'if entity value, file label, suggestion are all empty',
    suggestionQuery: {
      entityId: 'shared8',
      propertyName: 'enemy',
      language: 'en',
    },
  },
  {
    state: {
      labeled: true,
      withValue: true,
      withSuggestion: false,
      match: false,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason: 'if entity value and file label exists, suggestion is empty',
    suggestionQuery: {
      entityId: 'shared6',
      propertyName: 'enemy',
      language: 'en',
      fileId: { $exists: true },
    },
  },
  {
    state: {
      labeled: true,
      withValue: true,
      withSuggestion: false,
      match: false,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason:
      'when property is a date, and if entity value and file label exists, suggestion is empty',
    suggestionQuery: {
      entityId: 'shared7',
      propertyName: 'first_encountered',
      language: 'en',
    },
  },
  {
    state: {
      labeled: true,
      withValue: true,
      withSuggestion: true,
      match: false,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason: 'if file label exists, suggestion and entity value exist but do not match',
    suggestionQuery: {
      propertyName: 'super_powers',
      language: 'es',
    },
  },
  {
    state: {
      labeled: true,
      withValue: true,
      withSuggestion: true,
      match: false,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason:
      'when property is a date, if file label exists, suggestion and entity value exist but do not match',
    suggestionQuery: {
      entityId: 'shared7',
      propertyName: 'first_encountered',
      language: 'pr',
    },
  },
  {
    state: {
      labeled: false,
      withValue: true,
      withSuggestion: true,
      match: true,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason: 'if file label is empty, but suggestion and entity value exist and match',
    suggestionQuery: {
      entityId: 'shared1',
      propertyName: 'enemy',
    },
  },
  {
    state: {
      labeled: false,
      withValue: true,
      withSuggestion: true,
      match: true,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason:
      'when property is a date, and if file label is empty, but suggestion and entity value exist and match',
    suggestionQuery: {
      entityId: 'shared8',
      propertyName: 'first_encountered',
      language: 'en',
    },
  },
  {
    state: {
      labeled: false,
      withValue: true,
      withSuggestion: true,
      match: false,
      obsolete: false,
      processing: false,
      error: false,
    },
    reason: 'if file label is empty, suggestion and entity value exist but do not match',
    suggestionQuery: {
      entityId: 'shared6',
      propertyName: 'enemy',
      language: 'en',
    },
  },
  {
    reason: 'selects not labeled, if the entity does not have a value',
    suggestionQuery: {
      entityId: 'entityWithSelects3',
      propertyName: 'property_select',
    },
    state: { labeled: false },
  },
  {
    reason: 'selects labeled, if the entity has a value',
    suggestionQuery: {
      entityId: 'entityWithSelects',
      propertyName: 'property_select',
    },
    state: { labeled: true },
  },
  {
    reason: 'selects always with context',
    suggestionQuery: {
      entityId: 'entityWithSelects3',
      propertyName: 'property_select',
    },
    state: { hasContext: true },
  },
  {
    reason: 'selects as match if the value matches the suggestion',
    suggestionQuery: {
      entityId: 'entityWithSelects',
      propertyName: 'property_select',
    },
    state: { match: true },
  },
  {
    reason: 'selects as not match if the value does not match the suggestion',
    suggestionQuery: {
      entityId: 'entityWithSelects2',
      propertyName: 'property_select',
    },
    state: { match: false },
  },
  {
    reason: 'multiselects not labeled, if the entity does not have a value',
    suggestionQuery: {
      entityId: 'entityWithSelects3',
      propertyName: 'property_multiselect',
    },
    state: { labeled: false, withValue: false },
  },
  {
    reason: 'multiselects labeled, if the entity has a value',
    suggestionQuery: {
      entityId: 'entityWithSelects',
      propertyName: 'property_multiselect',
    },
    state: { labeled: true },
  },
  {
    reason: 'multiselects always with context',
    suggestionQuery: {
      entityId: 'entityWithSelects3',
      propertyName: 'property_multiselect',
    },
    state: { hasContext: true },
  },
  {
    reason: 'multiselects as match if the set of values strictly matches the suggestion',
    suggestionQuery: {
      entityId: 'entityWithSelects',
      propertyName: 'property_multiselect',
    },
    state: { match: true },
  },
  {
    reason: 'multiselects as not match if the set of values does not strictly match the suggestion',
    suggestionQuery: {
      entityId: 'entityWithSelects2',
      propertyName: 'property_multiselect',
    },
    state: { match: false },
  },
];

const newProcessingSuggestion: IXSuggestionType = {
  entityId: 'new_processing_suggestion',
  entityTemplate: personTemplateId.toString(),
  propertyName: 'new',
  extractorId: factory.id('new_extractor'),
  suggestedValue: 'new',
  segment: 'Some new segment',
  language: 'en',
  date: 5,
  page: 2,
  status: 'processing',
  error: '',
};

const newErroringSuggestion: IXSuggestionType = {
  entityId: 'new_erroring_suggestion',
  entityTemplate: personTemplateId.toString(),
  propertyName: 'new',
  extractorId: factory.id('new_extractor'),
  suggestedValue: 'new',
  segment: 'Some new segment',
  language: 'en',
  date: 5,
  page: 2,
  status: 'failed',
  error: 'Some error message',
};

const matchState = (match: boolean = true): IXSuggestionStateType => ({
  labeled: true,
  withValue: true,
  withSuggestion: true,
  match,
  hasContext: true,
  obsolete: false,
  processing: false,
  error: false,
});

const selectSuggestionBase = (propertyName: string, extractorName: string) => ({
  fileId: factory.id('fileForentityWithSelects'),
  entityId: 'entityWithSelects',
  entityTemplate: factory.id('templateWithSelects').toString(),
  propertyName,
  extractorId: factory.id(extractorName),
  date: 5,
  status: 'ready' as 'ready',
  error: '',
});

const prepareAndAcceptSuggestion = async (
  suggestedValue: string | string[],
  language: string,
  propertyName: string,
  extractorName: string,
  acceptanceParameters: {
    addedValues?: string[];
    removedValues?: string[];
  } = {}
) => {
  const suggestion = {
    ...selectSuggestionBase(propertyName, extractorName),
    suggestedValue,
    language,
  };
  await Suggestions.save(suggestion);

  const savedSuggestion = (await Suggestions.get({ extractorId: factory.id(extractorName) }, {}))
    .suggestions[0];
  const { _id, sharedId, entityId } = savedSuggestion;

  await Suggestions.accept([{ _id, sharedId, entityId, ...acceptanceParameters }]);
  const acceptedSuggestion = (await Suggestions.get({ extractorId: factory.id(extractorName) }, {}))
    .suggestions[0];
  const entities = await db.mongodb?.collection('entities').find({ sharedId }).toArray();
  const metadataValues = entities?.map(entity => entity.metadata[propertyName]);
  const allFiles = await db.mongodb?.collection('files').find({}).toArray();
  return { acceptedSuggestion, metadataValues, allFiles };
};

describe('suggestions', () => {
  afterAll(async () => {
    await db.disconnect();
  });

  describe('get()', () => {
    beforeEach(async () => {
      await db.setupFixturesAndContext(fixtures);
      await Suggestions.updateStates({});
    });

    it('should not fail on 0 suggestions', async () => {
      const { suggestions } = await Suggestions.get(
        { extractorId: factory.id('non_existing_extractor').toString() },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions.length).toBe(0);
    });

    it('should return all title suggestions', async () => {
      const { suggestions } = await Suggestions.get(
        { extractorId: factory.id('title_extractor').toString() },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions.length).toBe(6);
    });

    it('should return total page count', async () => {
      const { totalPages } = await Suggestions.get(
        { extractorId: factory.id('title_extractor').toString() },
        { page: { size: 50, number: 1 } }
      );
      expect(totalPages).toBe(1);
    });

    it('should be able to filter', async () => {
      const { suggestions } = await Suggestions.get(
        {
          extractorId: factory.id('super_powers_extractor').toString(),
        },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions.length).toBe(3);
    });

    it('should return suggestion and extra entity information', async () => {
      const { suggestions } = await Suggestions.get(
        { extractorId: factory.id('super_powers_extractor').toString() },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions).toMatchObject([
        {
          fileId: file2Id,
          propertyName: 'super_powers',
          extractorId: factory.id('super_powers_extractor'),
          suggestedValue: 'scientific knowledge',
          segment: 'he relies on his own scientific knowledge',
          language: 'en',
          date: 4,
          page: 5,
          currentValue: 'scientific knowledge',
          labeledValue: 'scientific knowledge',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: true,
            hasContext: true,
            obsolete: false,
            processing: false,
            error: false,
          },
          entityId: shared2enId,
          sharedId: 'shared2',
          entityTitle: 'Batman en',
        },
        {
          fileId: file3Id,
          propertyName: 'super_powers',
          extractorId: factory.id('super_powers_extractor'),
          suggestedValue: 'scientific knowledge es',
          segment: 'el confía en su propio conocimiento científico',
          language: 'es',
          date: 4,
          page: 5,
          currentValue: 'conocimiento científico',
          labeledValue: 'conocimiento científico',
          state: {
            labeled: true,
            withValue: true,
            withSuggestion: true,
            match: false,
            hasContext: true,
            obsolete: false,
            processing: false,
            error: false,
          },
          entityId: shared2esId,
          sharedId: 'shared2',
          entityTitle: 'Batman es',
        },
        {
          fileId: factory.id('F7'),
          propertyName: 'super_powers',
          extractorId: factory.id('super_powers_extractor'),
          segment: 'he puts up with Bruce Wayne',
          currentValue: 'no super powers',
          date: 4000,
          page: 3,
          entityId: factory.id('Alfred-english-entity'),
          entityTemplateId: personTemplateId,
          entityTitle: 'Alfred',
          error: '',
          labeledValue: 'no super powers',
          language: 'en',
          sharedId: 'shared3',
          state: {
            error: false,
            hasContext: true,
            labeled: true,
            match: false,
            obsolete: false,
            processing: false,
            withSuggestion: true,
            withValue: true,
          },
          suggestedValue: 'puts up with Bruce Wayne',
        },
      ]);
    });

    it('should return suggestion and extra entity information (multiselects)', async () => {
      const { suggestions } = await Suggestions.get(
        { extractorId: factory.id('multiselect_extractor').toString() },
        { page: { size: 50, number: 1 } }
      );
      expect(suggestions).toMatchObject([
        {
          fileId: factory.id('fileForentityWithSelects'),
          sharedId: 'entityWithSelects',
          propertyName: 'property_multiselect',
          extractorId: factory.id('multiselect_extractor'),
          suggestedValue: ['A', '1A'],
          language: 'en',
          date: 5,
          currentValue: ['A', '1A'],
          entityTitle: 'entityWithSelects',
        },
        {
          fileId: factory.id('fileForentityWithSelects2'),
          sharedId: 'entityWithSelects2',
          propertyName: 'property_multiselect',
          extractorId: factory.id('multiselect_extractor'),
          suggestedValue: ['A', '1B'],
          language: 'en',
          date: 5,
          currentValue: ['A', '1A'],
          entityTitle: 'entityWithSelects2',
        },
        {
          fileId: factory.id('fileForentityWithSelects3'),
          sharedId: 'entityWithSelects3',
          propertyName: 'property_multiselect',
          extractorId: factory.id('multiselect_extractor'),
          suggestedValue: ['A', '1A'],
          language: 'en',
          date: 5,
          currentValue: [],
          entityTitle: 'entityWithSelects3',
        },
      ]);
    });

    it('should return match status', async () => {
      const { suggestions: superPowersSuggestions } = await getSuggestions({
        extractorId: factory.id('super_powers_extractor').toString(),
      });

      expect(
        superPowersSuggestions.find((s: EntitySuggestionType) => s.language === 'en').state
      ).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });

      const { suggestions: enemySuggestions } = await getSuggestions(
        { extractorId: factory.id('enemy_extractor').toString() },
        6
      );

      expect(
        enemySuggestions.filter(
          (s: EntitySuggestionType) => s.sharedId === 'shared6' && s.language === 'en'
        )[1].state
      ).toEqual({
        labeled: false,
        withValue: true,
        withSuggestion: true,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });

      expect(
        enemySuggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared1').state
      ).toEqual({
        labeled: false,
        withValue: true,
        withSuggestion: true,
        match: true,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });

      expect(
        enemySuggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared8' && s.language === 'en'
        ).state
      ).toEqual({
        labeled: false,
        withValue: false,
        withSuggestion: false,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });

      const { suggestions: ageSuggestions } = await getSuggestions({
        extractorId: factory.id('age_extractor').toString(),
      });

      expect(ageSuggestions.length).toBe(5);
      expect(
        ageSuggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared5').state.obsolete
      ).toEqual(true);

      expect(
        ageSuggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared3').state
      ).toEqual({
        labeled: false,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should return mismatch status', async () => {
      const { suggestions: superPowersSuggestions } = await getSuggestions({
        extractorId: factory.id('super_powers_extractor').toString(),
      });
      expect(
        superPowersSuggestions.find((s: EntitySuggestionType) => s.language === 'es').state
      ).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: true,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });

      const { suggestions: enemySuggestions } = await getSuggestions({
        extractorId: factory.id('enemy_extractor').toString(),
      });
      expect(
        enemySuggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared6' && s.language === 'en'
        ).state
      ).toEqual({
        labeled: true,
        withValue: true,
        withSuggestion: false,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });

      expect(
        enemySuggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared9' && s.language === 'en'
        ).state
      ).toEqual({
        labeled: false,
        withValue: false,
        withSuggestion: true,
        match: false,
        hasContext: true,
        obsolete: false,
        processing: false,
        error: false,
      });
    });

    it('should return error status', async () => {
      const { suggestions } = await getSuggestions({
        extractorId: factory.id('age_extractor').toString(),
      });
      expect(
        suggestions.find((s: EntitySuggestionType) => s.sharedId === 'shared4').state.error
      ).toBe(true);
    });
  });

  describe('accept()', () => {
    describe('general', () => {
      beforeAll(async () => {
        await db.setupFixturesAndContext(fixtures);
        await Suggestions.updateStates({});
      });

      it('should accept suggestions', async () => {
        const { suggestions } = await getSuggestions({
          extractorId: factory.id('super_powers_extractor').toString(),
        });
        const labelMismatchedSuggestions = suggestions.filter(
          (sug: any) => sug.state.labeled && !sug.state.match
        );
        const ids = new Set(labelMismatchedSuggestions.map((sug: any) => sug._id.toString()));
        await Suggestions.accept(
          labelMismatchedSuggestions.map((sug: any) => ({
            _id: sug._id,
            sharedId: sug.sharedId,
            entityId: sug.entityId,
          }))
        );
        const { suggestions: newSuggestions } = await getSuggestions({
          extractorId: factory.id('super_powers_extractor').toString(),
        });
        const changedSuggestions = newSuggestions.filter((sug: any) => ids.has(sug._id.toString()));
        expect(changedSuggestions).toMatchObject([
          {
            _id: labelMismatchedSuggestions[0]._id,
            state: matchState(),
            suggestedValue: labelMismatchedSuggestions[0].suggestedValue,
            labeledValue: labelMismatchedSuggestions[0].suggestedValue,
          },
          {
            _id: labelMismatchedSuggestions[1]._id,
            state: matchState(),
            suggestedValue: labelMismatchedSuggestions[1].suggestedValue,
            labeledValue: labelMismatchedSuggestions[1].suggestedValue,
          },
        ]);
      });

      it('should require all suggestions to come from the same extractor', async () => {
        const [ageSuggestion] = (await getSuggestions({ extractorId: factory.id('age_extractor') }))
          .suggestions;
        const [superPowersSuggestion] = (
          await getSuggestions({
            extractorId: factory.id('super_powers_extractor'),
          })
        ).suggestions;
        await expect(
          Suggestions.accept([
            {
              _id: ageSuggestion._id,
              sharedId: ageSuggestion.sharedId,
              entityId: ageSuggestion.entityId,
            },
            {
              _id: superPowersSuggestion._id,
              sharedId: superPowersSuggestion.sharedId,
              entityId: superPowersSuggestion.entityId,
            },
          ])
        ).rejects.toThrow('All suggestions must come from the same extractor');
      });

      it('should not accept a suggestion with an error', async () => {
        const { suggestions } = await getSuggestions({
          extractorId: factory.id('age_extractor').toString(),
        });
        const errorSuggestion = suggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared4'
        );
        try {
          await Suggestions.accept([
            {
              _id: errorSuggestion._id,
              sharedId: errorSuggestion.sharedId,
              entityId: errorSuggestion.entityId,
            },
          ]);
        } catch (e: any) {
          expect(e?.message).toBe('Some Suggestions have an error.');
        }
      });
    });

    describe('numeric/date', () => {
      beforeAll(async () => {
        await db.setupFixturesAndContext(fixtures);
        await Suggestions.updateStates({});
      });

      it('should update entities of all languages if property name is numeric or date', async () => {
        const { suggestions } = await getSuggestions({
          extractorId: factory.id('age_extractor').toString(),
        });
        const suggestionsToAccept = suggestions.filter(
          sug => sug.sharedId === 'shared2' || sug.sharedId === 'shared1'
        );
        await Suggestions.accept([
          {
            _id: suggestionsToAccept[0]._id,
            sharedId: suggestionsToAccept[0].sharedId,
            entityId: suggestionsToAccept[0].entityId,
          },
          {
            _id: suggestionsToAccept[1]._id,
            sharedId: suggestionsToAccept[1].sharedId,
            entityId: suggestionsToAccept[1].entityId,
          },
        ]);

        const entities1 = await db.mongodb
          ?.collection('entities')
          .find({ sharedId: 'shared1' })
          .toArray();
        const ages1 = entities1?.map(entity => entity.metadata.age[0].value);
        expect(ages1).toEqual(['17', '17']);

        const entities2 = await db.mongodb
          ?.collection('entities')
          .find({ sharedId: 'shared2' })
          .toArray();
        const ages2 = entities2?.map(entity => entity.metadata.age[0].value);
        expect(ages2).toEqual(['20', '20', '20']);
      });
    });

    describe('select', () => {
      beforeEach(async () => {
        await db.setupFixturesAndContext(selectAcceptanceFixtureBase);
      });

      it('should validate that the id exists in the dictionary', async () => {
        const action = async () => {
          await prepareAndAcceptSuggestion('Z', 'en', 'property_select', 'select_extractor');
        };
        await expect(action()).rejects.toThrow('Id is invalid: Z (Nested Thesaurus).');
      });

      it('should update entities of all languages, with the properly translated labels', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } = await prepareAndAcceptSuggestion(
          'A',
          'en',
          'property_select',
          'select_extractor'
        );
        expect(acceptedSuggestion.state).toEqual(matchState());
        expect(metadataValues).toMatchObject([
          [{ value: 'A', label: 'A' }],
          [{ value: 'A', label: 'Aes' }],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });
    });

    describe('multiselect', () => {
      beforeEach(async () => {
        await db.setupFixturesAndContext(selectAcceptanceFixtureBase);
      });

      it('should validate that the ids exist in the dictionary', async () => {
        const action = async () => {
          await prepareAndAcceptSuggestion(
            ['Z', '1A', 'Y', 'A'],
            'en',
            'property_multiselect',
            'multiselect_extractor'
          );
        };
        await expect(action()).rejects.toThrow('Ids are invalid: Z, Y (Nested Thesaurus).');
      });

      it('should validate that partial acceptance is allowed only for multiselects', async () => {
        const addAction = async () => {
          await prepareAndAcceptSuggestion('1A', 'en', 'property_select', 'select_extractor', {
            addedValues: ['1A'],
          });
        };
        await expect(addAction()).rejects.toThrow(
          'Partial acceptance is only allowed for multiselects.'
        );

        const removeAction = async () => {
          await prepareAndAcceptSuggestion('1A', 'en', 'property_select', 'select_extractor', {
            removedValues: ['1B'],
          });
        };
        await expect(removeAction()).rejects.toThrow(
          'Partial acceptance is only allowed for multiselects.'
        );
      });

      it("should validate that the accepted id's through partial acceptance do exist on the suggestion", async () => {
        const action = async () => {
          await prepareAndAcceptSuggestion(
            ['1A', '1B'],
            'en',
            'property_multiselect',
            'multiselect_extractor',
            {
              addedValues: ['1A', 'Y', 'Z'],
            }
          );
        };
        await expect(action()).rejects.toThrow(
          'Some of the accepted values do not exist in the suggestion: Y, Z. Cannot accept values that are not suggested.'
        );
      });

      it("should validate that the id's to remove through partial acceptance do not exist on the suggestion", async () => {
        const action = async () => {
          await prepareAndAcceptSuggestion(
            ['1A', '1B'],
            'en',
            'property_multiselect',
            'multiselect_extractor',
            {
              removedValues: ['1A', 'A'],
            }
          );
        };
        await expect(action()).rejects.toThrow(
          'Some of the removed values exist in the suggestion: 1A. Cannot remove values that are suggested.'
        );
      });

      it('should allow full acceptance, and update entites of all languages, with the properly translated labels', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } = await prepareAndAcceptSuggestion(
          ['1A', '1B'],
          'en',
          'property_multiselect',
          'multiselect_extractor'
        );
        expect(acceptedSuggestion.state).toEqual(matchState());
        expect(metadataValues).toMatchObject([
          [
            { value: '1A', label: '1A' },
            { value: '1B', label: '1B' },
          ],
          [
            { value: '1A', label: '1Aes' },
            { value: '1B', label: '1Bes' },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should allow partial acceptance, and update entites of all languages, with the properly translated labels', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } = await prepareAndAcceptSuggestion(
          ['B', '1B'],
          'en',
          'property_multiselect',
          'multiselect_extractor',
          {
            addedValues: ['B'],
          }
        );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toMatchObject([
          [
            { value: 'A', label: 'A' },
            { value: '1A', label: '1A' },
            { value: 'B', label: 'B' },
          ],
          [
            { value: 'A', label: 'Aes' },
            { value: '1A', label: '1Aes' },
            { value: 'B', label: 'Bes' },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should do nothing on partial acceptance if the id is already in the entity metadata', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } = await prepareAndAcceptSuggestion(
          ['1A', '1B'],
          'en',
          'property_multiselect',
          'multiselect_extractor',
          {
            addedValues: ['1A'],
          }
        );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toMatchObject([
          [
            { value: 'A', label: 'A' },
            { value: '1A', label: '1A' },
          ],
          [
            { value: 'A', label: 'Aes' },
            { value: '1A', label: '1Aes' },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should allow removal through partial acceptance, and update entities of all languages', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } = await prepareAndAcceptSuggestion(
          ['1A', '1B'],
          'en',
          'property_multiselect',
          'multiselect_extractor',
          {
            removedValues: ['A'],
          }
        );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toMatchObject([
          [{ value: '1A', label: '1A' }],
          [{ value: '1A', label: '1Aes' }],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should do nothing on removal through partial acceptance if the id is not in the entity metadata', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } = await prepareAndAcceptSuggestion(
          ['1A', 'A'],
          'en',
          'property_multiselect',
          'multiselect_extractor',
          {
            removedValues: ['B'],
          }
        );
        expect(acceptedSuggestion.state).toEqual(matchState());
        expect(metadataValues).toMatchObject([
          [
            { value: 'A', label: 'A' },
            { value: '1A', label: '1A' },
          ],
          [
            { value: 'A', label: 'Aes' },
            { value: '1A', label: '1Aes' },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });
    });
  });

  describe('save()', () => {
    beforeEach(async () => {
      await db.setupFixturesAndContext(fixtures);
    });

    describe('on suggestion status error', () => {
      it('should mark error in state as well', async () => {
        await Suggestions.save(newErroringSuggestion);
        expect(await findOneSuggestion({ entityId: 'new_erroring_suggestion' })).toMatchObject({
          ...newErroringSuggestion,
          state: {
            error: true,
          },
        });
        const original = await findOneSuggestion({});
        const changed: IXSuggestionType = { ...original, status: 'failed' };
        await Suggestions.save(changed);
        expect(await findOneSuggestion({ _id: original._id })).toMatchObject({
          ...changed,
          state: {
            error: true,
          },
        });
      });
    });

    describe('on suggestion status processing', () => {
      it('should mark processing in state as well', async () => {
        await Suggestions.save(newProcessingSuggestion);
        expect(await findOneSuggestion({ entityId: 'new_processing_suggestion' })).toMatchObject({
          ...newProcessingSuggestion,
          state: {
            processing: true,
          },
        });
        const original = await findOneSuggestion({});
        const changed: IXSuggestionType = { ...original, status: 'processing' };
        await Suggestions.save(changed);
        expect(await findOneSuggestion({ _id: original._id })).toMatchObject({
          ...changed,
          state: {
            processing: true,
          },
        });
      });
    });
  });

  describe('updateStates()', () => {
    beforeAll(async () => {
      await db.setupFixturesAndContext(fixtures);
    });

    it.each(stateUpdateCases)('should mark $reason', async ({ state, suggestionQuery }) => {
      const original = await findOneSuggestion(suggestionQuery);
      const idQuery = { _id: original._id };
      await Suggestions.updateStates(idQuery);
      const changed = await findOneSuggestion(idQuery);
      expect(changed).toMatchObject({
        ...original,
        state,
      });
    });
  });

  describe('setObsolete()', () => {
    beforeEach(async () => {
      await db.setupFixturesAndContext(fixtures);
    });

    it('should set the queried suggestions to obsolete state', async () => {
      const query = { entityId: 'shared1' };
      await Suggestions.setObsolete(query);
      const obsoletes = await db.mongodb?.collection('ixsuggestions').find(query).toArray();
      expect(obsoletes?.every(s => s.state.obsolete)).toBe(true);
      expect(obsoletes?.length).toBe(4);
    });
  });

  describe('markSuggestionsWithoutSegmentation()', () => {
    beforeEach(async () => {
      await db.setupFixturesAndContext(fixtures);
    });

    it('should mark the suggestions without segmentation to error state', async () => {
      const query = { entityId: 'shared1' };
      await Suggestions.markSuggestionsWithoutSegmentation(query);
      const notSegmented = await db.mongodb?.collection('ixsuggestions').find(query).toArray();
      expect(notSegmented?.every(s => s.state.error)).toBe(true);
    });

    it('should not mark suggestions when segmentations are correct', async () => {
      const query = { entityId: 'shared2' };
      await Suggestions.markSuggestionsWithoutSegmentation(query);
      const segmented = await db.mongodb
        ?.collection('ixsuggestions')
        .find({ _id: suggestionId })
        .toArray();
      const notSegmented = await db.mongodb
        ?.collection('ixsuggestions')
        .find({ _id: shared2AgeSuggestionId })
        .toArray();
      expect(segmented?.length).toBe(1);
      expect(segmented?.every(s => s.state?.error)).toBe(false);
      expect(notSegmented?.length).toBe(1);
      expect(notSegmented?.every(s => s.state.error)).toBe(true);
    });
  });

  describe('saveMultiple()', () => {
    beforeEach(async () => {
      await db.setupFixturesAndContext(fixtures);
    });

    it('should handle everything at once', async () => {
      const all: IXSuggestionType[] = (await db.mongodb
        ?.collection('ixsuggestions')
        .find({})
        .toArray()) as IXSuggestionType[];
      const originals = await Promise.all(
        stateUpdateCases.map(async ({ suggestionQuery }) => findOneSuggestion(suggestionQuery))
      );
      const newSuggestions = [newErroringSuggestion, newProcessingSuggestion];
      const toSave = all.concat(newSuggestions);

      await Suggestions.saveMultiple(toSave);

      const changedSuggestions = await Promise.all(
        stateUpdateCases.map(async ({ suggestionQuery }) => findOneSuggestion(suggestionQuery))
      );

      for (let i = 0; i < stateUpdateCases.length; i += 1) {
        const original = originals[i];
        const { state } = stateUpdateCases[i];
        const changed = changedSuggestions[i];
        expect(changed).toMatchObject({
          ...original,
          state,
        });
      }

      expect(await findOneSuggestion({ entityId: newErroringSuggestion.entityId })).toMatchObject({
        ...newErroringSuggestion,
        state: {
          error: true,
        },
      });
      expect(await findOneSuggestion({ entityId: newProcessingSuggestion.entityId })).toMatchObject(
        {
          ...newProcessingSuggestion,
          state: {
            processing: true,
          },
        }
      );
    });
  });
});
