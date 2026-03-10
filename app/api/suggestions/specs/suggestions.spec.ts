/* eslint-disable max-params */
/* eslint-disable max-statements */
import { testingEnvironment } from 'api/utils/testingEnvironment';
import db from 'api/utils/testing_db';

import { ObjectId } from 'mongodb';
import {
  EntitySuggestionType,
  IXSuggestionStateType,
  IXSuggestionType,
  IXSuggestionsFilter,
} from 'shared/types/suggestionType';
import { applicationEventsBus } from 'api/core/libs/eventsbus';
import { Suggestions } from '../suggestions';
import {
  factory,
  fixtures,
  relationshipAcceptanceFixtureBase,
  selectAcceptanceFixtureBase,
  shared2AgeSuggestionId,
  shared2esId,
  suggestionId,
} from './fixtures';
import { GetSuggestionsForTableQuery } from '../getSuggestionsForTableQuery/getSuggestionsForTableQuery';

const _getSuggestions = async (query: any) =>
  testingEnvironment.db.getCollection('ixsuggestions')?.find(query).toArray() || [];

const getSuggestions = async (filter: IXSuggestionsFilter, size = 50) => {
  const query = new GetSuggestionsForTableQuery();
  const result = query.execute({
    extractorId: filter.extractorId.toString(),
    filter: filter.customFilter,
    pagination: {
      size,
      number: 1,
    },
  });
  return result;
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

type SuggestionBase = Pick<
  IXSuggestionType,
  | 'fileId'
  | 'entityId'
  | 'entityTemplate'
  | 'propertyName'
  | 'extractorId'
  | 'date'
  | 'status'
  | 'error'
  | 'entityLanguageId'
>;

const prepareAndAcceptSuggestion = async (
  suggestionBase: SuggestionBase,
  suggestedValue: string | string[],
  language: string,
  propertyName: string,
  extractorName: string,
  acceptanceParameters: { addedValues?: string[]; removedValues?: string[] } = {}
) => {
  // Resolve correct entityLanguageId from DB to match fixtures
  const langEntity = await db.mongodb
    ?.collection('entities')
    .findOne({ sharedId: suggestionBase.entityId, language });
  if (!langEntity?._id) {
    throw new Error(`Test fixture missing entity for ${suggestionBase.entityId}/${language}`);
  }

  const suggestion = {
    ...suggestionBase,
    entityLanguageId: langEntity._id, // override the placeholder
    suggestedValue,
    language,
  };
  await Suggestions.save(suggestion);

  const savedSuggestion = (await getSuggestions({ extractorId: factory.id(extractorName) }))
    .suggestions[0];
  const { _id, sharedId, entityId } = savedSuggestion;

  await Suggestions.accept([{ _id, sharedId, entityId, ...acceptanceParameters }]);
  const acceptedSuggestion = (await getSuggestions({ extractorId: factory.id(extractorName) }))
    .suggestions[0];
  const entities = await db.mongodb?.collection('entities').find({ sharedId }).toArray();
  const metadataValues = entities?.map(entity => entity.metadata[propertyName]);
  const allFiles = await db.mongodb?.collection('files').find({}).toArray();
  return { acceptedSuggestion, metadataValues, allFiles };
};

const selectSuggestionBase = (
  propertyName: string,
  extractorName: string,
  language: string
): SuggestionBase => ({
  fileId: factory.id('fileForentityWithSelects'),
  entityId: 'entityWithSelects',
  entityTemplate: factory.id('templateWithSelects').toString(),
  propertyName,
  extractorId: factory.id(extractorName),
  date: 5,
  status: 'ready' as 'ready',
  error: '',
  entityLanguageId: factory.id(`entityWithSelects_${language}`),
});

const prepareAndAcceptSelectSuggestion = async (
  suggestedValue: string | string[],
  language: string,
  propertyName: string,
  extractorName: string,
  acceptanceParameters: {
    addedValues?: string[];
    removedValues?: string[];
  } = {}
) =>
  prepareAndAcceptSuggestion(
    selectSuggestionBase(propertyName, extractorName, language),
    suggestedValue,
    language,
    propertyName,
    extractorName,
    acceptanceParameters
  );

const relationshipSuggestionBase = (
  propertyName: string,
  extractorName: string,
  language: string
): SuggestionBase => ({
  fileId: factory.id('fileForEntityWithRelationships'),
  entityId: 'entityWithRelationships_sId',
  entityTemplate: factory.id('rel_template').toString(),
  propertyName,
  extractorId: factory.id(extractorName),
  date: 5,
  status: 'ready' as 'ready',
  error: '',
  entityLanguageId: factory.id(`entityWithRelationships_sId_${language}`),
});

const prepareAndAcceptRelationshipSuggestion = async (
  suggestedValue: string | string[],
  language: string,
  propertyName: string,
  extractorName: string,
  acceptanceParameters: {
    addedValues?: string[];
    removedValues?: string[];
  } = {}
) =>
  prepareAndAcceptSuggestion(
    relationshipSuggestionBase(propertyName, extractorName, language),
    suggestedValue,
    language,
    propertyName,
    extractorName,
    acceptanceParameters
  );

describe('suggestions', () => {
  beforeAll(() => {
    Suggestions.registerEventListeners(applicationEventsBus);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('accept()', () => {
    describe('general', () => {
      beforeAll(async () => {
        await testingEnvironment.setUp(fixtures);
      });

      it('should accept suggestions', async () => {
        const { suggestions } = await getSuggestions({
          extractorId: factory.id('super_powers_extractor'),
        });
        const labelMismatchedSuggestions = suggestions.filter(
          (sug: any) => sug.state.withSuggestion && !sug.state.match
        );

        const ids = new Set(labelMismatchedSuggestions.map((sug: any) => sug._id.toString()));

        await Suggestions.accept(
          labelMismatchedSuggestions.map((sug: any) => ({
            _id: sug._id,
            sharedId: sug.sharedId,
            entityId: sug.entityId,
          }))
        );

        const acceptedSuggestions = await _getSuggestions({
          extractorId: factory.id('super_powers_extractor'),
        });

        const changedSuggestions = acceptedSuggestions.filter((sug: any) =>
          ids.has(sug._id.toString())
        );

        expect(changedSuggestions).toMatchObject([
          {
            language: 'es',
            entityId: 'shared2',
            currentValue: 'scientific knowledge es',
            entityLanguageId: shared2esId,
          },
          {
            language: 'en',
            entityId: 'shared3',
            currentValue: 'puts up with Bruce Wayne',
            entityLanguageId: factory.id('Alfred-english-entity'),
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
              _id: ageSuggestion._id!,
              sharedId: ageSuggestion.sharedId,
              entityId: ageSuggestion.entityId,
            },
            {
              _id: superPowersSuggestion._id!,
              sharedId: superPowersSuggestion.sharedId,
              entityId: superPowersSuggestion.entityId,
            },
          ])
        ).rejects.toThrow('All suggestions must come from the same extractor');
      });

      it('should not accept a suggestion with an error', async () => {
        const { suggestions } = await getSuggestions({
          extractorId: factory.id('age_extractor'),
        });

        const errorSuggestion = suggestions.find(
          (s: EntitySuggestionType) => s.sharedId === 'shared4'
        );

        try {
          await Suggestions.accept([
            {
              _id: errorSuggestion!._id!,
              sharedId: errorSuggestion!.sharedId,
              entityId: errorSuggestion!.entityId,
            },
          ]);
        } catch (e: any) {
          expect(e?.message).toBe('Some Suggestions have an error.');
        }
      });
    });

    describe('numeric/date', () => {
      beforeAll(async () => {
        await testingEnvironment.setUp(fixtures);
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
            _id: suggestionsToAccept[0]._id!,
            sharedId: suggestionsToAccept[0].sharedId,
            entityId: suggestionsToAccept[0].entityId,
          },
          {
            _id: suggestionsToAccept[1]._id!,
            sharedId: suggestionsToAccept[1].sharedId,
            entityId: suggestionsToAccept[1].entityId,
          },
        ]);

        const entities1 = await db.mongodb
          ?.collection('entities')
          .find({ sharedId: 'shared1' })
          .toArray();
        const ages1 = entities1?.map(entity => entity.metadata.age[0].value);
        expect(ages1).toEqual([17, 17]);

        const entities2 = await db.mongodb
          ?.collection('entities')
          .find({ sharedId: 'shared2' })
          .toArray();
        const ages2 = entities2?.map(entity => entity.metadata.age[0].value);

        expect(ages2).toEqual([20, 20, 20]);

        const acceptedSuggestions = await _getSuggestions({
          extractorId: factory.id('age_extractor'),
          entityId: { $in: ['shared1', 'shared2'] },
        });

        expect(acceptedSuggestions).toMatchObject([
          {
            entityId: 'shared1',
            language: 'en',
            currentValue: 17,
          },

          {
            entityId: 'shared2',
            language: 'en',
            currentValue: 20,
          },
        ]);
      });
    });

    describe('select', () => {
      beforeEach(async () => {
        await testingEnvironment.setUp(selectAcceptanceFixtureBase);
      });

      it('should validate that the id exists in the dictionary', async () => {
        const action = async () => {
          await prepareAndAcceptSelectSuggestion('Z', 'en', 'property_select', 'select_extractor');
        };
        await expect(action()).rejects.toThrow('Id is invalid: Z (Nested Thesaurus).');
      });

      it('should update entities of all languages, with the properly translated labels', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptSelectSuggestion('A', 'en', 'property_select', 'select_extractor');

        expect(acceptedSuggestion.state).toEqual(matchState());
        expect(metadataValues).toEqual([
          [{ value: 'A', label: 'A' }],
          [{ value: 'A', label: 'Aes' }],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should handle grouped values', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptSelectSuggestion('1A', 'en', 'property_select', 'select_extractor');
        expect(acceptedSuggestion.state).toEqual(matchState());
        expect(metadataValues).toEqual([
          [{ value: '1A', label: '1A', parent: { value: '1', label: '1' } }],
          [{ value: '1A', label: '1Aes', parent: { value: '1', label: '1es' } }],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });
    });

    describe('multiselect', () => {
      beforeEach(async () => {
        await testingEnvironment.setUp(selectAcceptanceFixtureBase);
      });

      it('should validate that the ids exist in the dictionary', async () => {
        const action = async () => {
          await prepareAndAcceptSelectSuggestion(
            ['Z', '1A', 'Y', 'A'],
            'en',
            'property_multiselect',
            'multiselect_extractor'
          );
        };
        await expect(action()).rejects.toThrow('Ids are invalid: Z, Y (Nested Thesaurus).');
      });

      it('should validate that partial acceptance is allowed only for multiselects/relationships', async () => {
        const addAction = async () => {
          await prepareAndAcceptSelectSuggestion(
            '1A',
            'en',
            'property_select',
            'select_extractor',
            {
              addedValues: ['1A'],
            }
          );
        };
        await expect(addAction()).rejects.toThrow(
          'Partial acceptance is only allowed for multiselects or relationships.'
        );

        const removeAction = async () => {
          await prepareAndAcceptSelectSuggestion(
            '1A',
            'en',
            'property_select',
            'select_extractor',
            {
              removedValues: ['1B'],
            }
          );
        };
        await expect(removeAction()).rejects.toThrow(
          'Partial acceptance is only allowed for multiselects or relationships.'
        );
      });

      it("should validate that the accepted id's through partial acceptance do exist on the suggestion", async () => {
        const action = async () => {
          await prepareAndAcceptSelectSuggestion(
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
          await prepareAndAcceptSelectSuggestion(
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
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptSelectSuggestion(
            ['1A', '1B'],
            'en',
            'property_multiselect',
            'multiselect_extractor'
          );
        expect(acceptedSuggestion.state).toEqual(matchState());
        expect(metadataValues).toEqual([
          [
            { value: '1A', label: '1A', parent: { value: '1', label: '1' } },
            { value: '1B', label: '1B', parent: { value: '1', label: '1' } },
          ],
          [
            { value: '1A', label: '1Aes', parent: { value: '1', label: '1es' } },
            { value: '1B', label: '1Bes', parent: { value: '1', label: '1es' } },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should allow partial acceptance, and update entites of all languages, with the properly translated labels', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptSelectSuggestion(
            ['B', '1B'],
            'en',
            'property_multiselect',
            'multiselect_extractor',
            {
              addedValues: ['B'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toEqual([
          [
            { value: 'A', label: 'A' },
            { value: '1A', label: '1A', parent: { value: '1', label: '1' } },
            { value: 'B', label: 'B' },
          ],
          [
            { value: 'A', label: 'Aes' },
            { value: '1A', label: '1Aes', parent: { value: '1', label: '1es' } },
            { value: 'B', label: 'Bes' },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should do nothing on partial acceptance if the id is already in the entity metadata', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptSelectSuggestion(
            ['1A', '1B'],
            'en',
            'property_multiselect',
            'multiselect_extractor',
            {
              addedValues: ['1A'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toEqual([
          [
            { value: 'A', label: 'A' },
            { value: '1A', label: '1A', parent: { value: '1', label: '1' } },
          ],
          [
            { value: 'A', label: 'Aes' },
            { value: '1A', label: '1Aes', parent: { value: '1', label: '1es' } },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should allow removal through partial acceptance, and update entities of all languages', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptSelectSuggestion(
            ['1A', '1B'],
            'en',
            'property_multiselect',
            'multiselect_extractor',
            {
              removedValues: ['A'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toEqual([
          [{ value: '1A', label: '1A', parent: { value: '1', label: '1' } }],
          [{ value: '1A', label: '1Aes', parent: { value: '1', label: '1es' } }],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });

      it('should do nothing on removal through partial acceptance if the id is not in the entity metadata', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptSelectSuggestion(
            ['1A', 'A'],
            'en',
            'property_multiselect',
            'multiselect_extractor',
            {
              removedValues: ['B'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState());
        expect(metadataValues).toEqual([
          [
            { value: 'A', label: 'A' },
            { value: '1A', label: '1A', parent: { value: '1', label: '1' } },
          ],
          [
            { value: 'A', label: 'Aes' },
            { value: '1A', label: '1Aes', parent: { value: '1', label: '1es' } },
          ],
        ]);
        expect(allFiles).toEqual(selectAcceptanceFixtureBase.files);
      });
    });

    describe('relationship', () => {
      beforeEach(async () => {
        await testingEnvironment.setUp(relationshipAcceptanceFixtureBase);
      });

      it('should validate that the entities in the suggestion exist', async () => {
        const action = async () => {
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'X_sId', 'S2_sId', 'Y_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor'
          );
        };
        await expect(action()).rejects.toThrow(
          'The following sharedIds do not exist in the database: X_sId, Y_sId.'
        );
      });

      it("should validate that the accepted id's through partial acceptance do exist on the suggestion", async () => {
        const action = async () => {
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S2_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor',
            {
              addedValues: ['S1_sId', 'X_sId', 'Y_sId'],
            }
          );
        };
        await expect(action()).rejects.toThrow(
          'Some of the accepted values do not exist in the suggestion: X_sId, Y_sId. Cannot accept values that are not suggested.'
        );
      });

      it("should validate that the id's to remove through partial acceptance do not exist on the suggestion", async () => {
        const action = async () => {
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S2_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor',
            {
              removedValues: ['S1_sId', 'S0_sId'],
            }
          );
        };
        await expect(action()).rejects.toThrow(
          'Some of the removed values exist in the suggestion: S1_sId. Cannot remove values that are suggested.'
        );
      });

      it('should allow full acceptance, and update entites of all languages, with the properly translated labels', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S3_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor'
          );
        expect(acceptedSuggestion.state).toEqual(matchState(true));
        expect(metadataValues).toMatchObject([
          [
            { value: 'S1_sId', label: 'S1' },
            { value: 'S3_sId', label: 'S3' },
          ],
          [
            { value: 'S1_sId', label: 'S1_es' },
            { value: 'S3_sId', label: 'S3_es' },
          ],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);
      });

      it('should allow partial acceptance, and update entites of all languages, with the properly translated labels', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S3_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor',
            {
              addedValues: ['S3_sId'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toMatchObject([
          [
            { value: 'S1_sId', label: 'S1' },
            { value: 'S2_sId', label: 'S2' },
            { value: 'S3_sId', label: 'S3' },
          ],
          [
            { value: 'S1_sId', label: 'S1_es' },
            { value: 'S2_sId', label: 'S2_es' },
            { value: 'S3_sId', label: 'S3_es' },
          ],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);
      });

      it('should do nothing on partial acceptance if the id is already in the entity metadata', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S3_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor',
            {
              addedValues: ['S1_sId'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toMatchObject([
          [
            { value: 'S1_sId', label: 'S1' },
            { value: 'S2_sId', label: 'S2' },
          ],
          [
            { value: 'S1_sId', label: 'S1_es' },
            { value: 'S2_sId', label: 'S2_es' },
          ],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);
      });

      it('should allow removal through partial acceptance, and update entities of all languages', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S3_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor',
            {
              removedValues: ['S2_sId'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState(false));
        expect(metadataValues).toMatchObject([
          [{ value: 'S1_sId', label: 'S1' }],
          [{ value: 'S1_sId', label: 'S1_es' }],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);
      });

      it('should do nothing on removal through partial acceptance if the id is not in the entity metadata', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S2_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor',
            {
              removedValues: ['S3_sId'],
            }
          );
        expect(acceptedSuggestion.state).toEqual(matchState(true));
        expect(metadataValues).toMatchObject([
          [
            { value: 'S1_sId', label: 'S1' },
            { value: 'S2_sId', label: 'S2' },
          ],
          [
            { value: 'S1_sId', label: 'S1_es' },
            { value: 'S2_sId', label: 'S2_es' },
          ],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);
      });

      it('should update inherited values per language', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S3_sId'],
            'en',
            'relationship_with_inheritance',
            'relationship_with_inheritance_extractor'
          );
        expect(acceptedSuggestion.state).toEqual(matchState(true));
        expect(metadataValues).toMatchObject([
          [
            {
              value: 'S1_sId',
              label: 'S1',
              inheritedType: 'text',
              inheritedValue: [
                {
                  value: 'inherited text',
                },
              ],
            },
            {
              value: 'S3_sId',
              label: 'S3',
              inheritedType: 'text',
              inheritedValue: [
                {
                  value: 'inherited text 3',
                },
              ],
            },
          ],
          [
            {
              value: 'S1_sId',
              label: 'S1_es',
              inheritedType: 'text',
              inheritedValue: [
                {
                  value: 'inherited text Spanish',
                },
              ],
            },
            {
              value: 'S3_sId',
              label: 'S3_es',
              inheritedType: 'text',
              inheritedValue: [
                {
                  value: 'inherited text 3 Spanish',
                },
              ],
            },
          ],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);
      });

      it('should check if the suggested entities are of the correct template', async () => {
        const action = async () => {
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'other_source'],
            'en',
            'relationship_to_source',
            'relationship_extractor'
          );
        };
        await expect(action()).rejects.toThrow(
          'The following sharedIds do not match the content template in the relationship property: other_source.'
        );
      });

      it('should handle relationship properties with any template as content', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S2_sId', 'other_source_2'],
            'en',
            'relationship_to_any',
            'relationship_to_any_extractor'
          );
        expect(acceptedSuggestion.state).toEqual(matchState(true));
        expect(metadataValues).toMatchObject([
          [
            {
              value: 'S2_sId',
              label: 'S2',
            },
            {
              value: 'other_source_2',
              label: 'Other Source 2',
            },
          ],
          [
            {
              value: 'S2_sId',
              label: 'S2_es',
            },
            {
              value: 'other_source_2',
              label: 'Other Source 2 Spanish',
            },
          ],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);
      });

      it('should remove or create connections as necessary', async () => {
        const { acceptedSuggestion, metadataValues, allFiles } =
          await prepareAndAcceptRelationshipSuggestion(
            ['S1_sId', 'S3_sId'],
            'en',
            'relationship_to_source',
            'relationship_extractor'
          );
        expect(acceptedSuggestion.state).toEqual(matchState(true));
        expect(metadataValues).toMatchObject([
          [
            { value: 'S1_sId', label: 'S1' },
            { value: 'S3_sId', label: 'S3' },
          ],
          [
            { value: 'S1_sId', label: 'S1_es' },
            { value: 'S3_sId', label: 'S3_es' },
          ],
        ]);
        expect(allFiles).toEqual(relationshipAcceptanceFixtureBase.files);

        const removedConnection = await db.mongodb
          ?.collection('connections')
          .findOne({ entity: 'S2_sId', template: factory.id('related') });
        expect(removedConnection).toBeNull();

        const newConnection = await db.mongodb
          ?.collection('connections')
          .findOne({ entity: 'S3_sId' });
        expect(newConnection).toMatchObject({
          entity: 'S3_sId',
          hub: expect.any(ObjectId),
          template: factory.id('related'),
        });
        const newHub = newConnection?.hub;
        const pairedConnection = await db.mongodb
          ?.collection('connections')
          .findOne({ entity: 'entityWithRelationships_sId', hub: newHub });
        expect(pairedConnection).toMatchObject({
          entity: 'entityWithRelationships_sId',
          hub: newHub,
        });
      });
    });
  });

  describe('setObsolete()', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures);
    });

    it('should set the queried suggestions to obsolete state', async () => {
      const query = { entityId: 'shared1' };
      await Suggestions.setObsolete(query);
      const obsoletes = await db.mongodb?.collection('ixsuggestions').find(query).toArray();
      expect(obsoletes?.every(s => s.state.obsolete && s.state.match === null)).toBe(true);
      expect(obsoletes?.length).toBe(4);
    });
  });

  describe('markSuggestionsWithoutSegmentation()', () => {
    beforeEach(async () => {
      await testingEnvironment.setUp(fixtures);
    });

    it('should mark the suggestions without segmentation to error state', async () => {
      const query = { entityId: 'shared1' };
      await Suggestions.markSuggestionsWithoutSegmentation(query);
      const notSegmented = await db.mongodb?.collection('ixsuggestions').find(query).toArray();
      expect(notSegmented?.every(s => s.state.error && s.state.match === null)).toBe(true);
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
      expect(notSegmented?.every(s => s.state.error && s.state.match === null)).toBe(true);
    });
  });

  describe('markSuggestionsAsTrainingSamples()', () => {
    const newCreationDate = 13071977;

    beforeEach(async () => {
      const trainingFixtures = {
        ...fixtures,
        ixmodels: [
          fixtures.ixmodels[0],
          {
            ...fixtures.ixmodels[1],
            creationDate: newCreationDate,
          },
          ...fixtures.ixmodels.slice(2),
        ],
      };
      await testingEnvironment.setUp(trainingFixtures);
    });

    it('should mark the suggestions as training samples', async () => {
      const entities = ['shared1', 'shared3', 'shared4', 'shared6'];
      await Suggestions.markSuggestionsAsTrainingSamples(
        entities,
        factory.id('title_extractor').toString()
      );
      const trainingSamples = await db.mongodb
        ?.collection('ixsuggestions')
        .find({ trainingSample: true })
        .toArray();

      expect(trainingSamples?.length).toBe(5);
      expect(trainingSamples?.map(s => s.entityId)).toEqual([
        'shared1',
        'shared1',
        'shared3',
        'shared4',
        'shared6',
      ]);
    });
  });
});
