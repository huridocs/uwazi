import entities from 'api/entities';
import translations from 'api/i18n/translations';
import thesauri from 'api/thesauri';
import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { arrayBidirectionalDiff } from 'shared/data_utils/arrayBidirectionalDiff';
import { IndexTypes, objectIndex } from 'shared/data_utils/objectIndex';
import { setIntersection } from 'shared/data_utils/setUtils';
import { ObjectIdSchema, PropertySchema } from 'shared/types/commonTypes';
import { EntitySchema } from 'shared/types/entityType';
import { IXSuggestionType } from 'shared/types/suggestionType';

class SuggestionAcceptanceError extends Error {}

interface AcceptedSuggestion {
  _id: ObjectIdSchema;
  sharedId: string;
  entityId: string;
  addedValues?: string[];
  removedValues?: string[];
}

const fetchThesaurus = async (thesaurusId: PropertySchema['content']) => {
  const dict = await thesauri.getById(thesaurusId);
  const thesaurusName = dict!.name;
  const flat = flatThesaurusValues(dict);
  const indexedlabels = objectIndex(
    flat,
    v => v.id,
    v => v.label
  );
  return { name: thesaurusName, id: thesaurusId, indexedlabels };
};

const fetchTranslations = async (property: PropertySchema) => {
  const trs = await translations.get({ context: property.content });
  const indexed = objectIndex(
    trs,
    t => t.locale || '',
    t => t.contexts?.[0].values
  );
  return indexed;
};

const fetchSelectResources = async (property: PropertySchema) => {
  const thesaurus = await fetchThesaurus(property.content);
  const labelTranslations = await fetchTranslations(property);
  return { thesaurus, translations: labelTranslations };
};

const resourceFetchers = {
  _default: async () => ({}),
  select: fetchSelectResources,
  multiselect: fetchSelectResources,
};

const fetchResources = async (property: PropertySchema) => {
  // @ts-ignore
  const fetcher = resourceFetchers[property.type] || resourceFetchers._default;
  return fetcher(property);
};

const getSuggestion = (
  entity: EntitySchema,
  suggestionsById: Record<IndexTypes, IXSuggestionType>,
  acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>
) => suggestionsById[acceptedSuggestionsBySharedId[entity.sharedId || '']._id.toString()];

const getRawValue = (
  entity: EntitySchema,
  suggestionsById: Record<IndexTypes, IXSuggestionType>,
  acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>
) => getSuggestion(entity, suggestionsById, acceptedSuggestionsBySharedId)?.suggestedValue;

const checkValuesInThesaurus = (
  values: string[],
  thesaurusName: string,
  indexedlabels: Record<IndexTypes, string>
) => {
  const missingValues = values.filter(v => !(v in indexedlabels));

  if (missingValues.length === 1) {
    throw new SuggestionAcceptanceError(`Id is invalid: ${missingValues[0]} (${thesaurusName}).`);
  }
  if (missingValues.length > 1) {
    throw new SuggestionAcceptanceError(
      `Ids are invalid: ${missingValues.join(', ')} (${thesaurusName}).`
    );
  }
};

const mapLabels = (
  values: string[],
  entity: EntitySchema,
  thesaurus: { indexedlabels: Record<IndexTypes, string> },
  translation: Record<IndexTypes, Record<IndexTypes, string>>
) => {
  const labels = values.map(v => thesaurus.indexedlabels[v]);
  const translatedLabels = labels.map(l => translation[entity.language || '']?.[l]);
  return values.map((value, index) => ({ value, label: translatedLabels[index] }));
};

function readAddedValues(acceptedSuggestion: AcceptedSuggestion, suggestionValues: string[]) {
  const addedValues = acceptedSuggestion.addedValues || [];
  const addedButNotSuggested = arrayBidirectionalDiff(
    suggestionValues,
    addedValues,
    v => v,
    v => v
  ).added;
  if (addedButNotSuggested.length > 0) {
    throw new SuggestionAcceptanceError(
      `Some of the accepted values do not exist in the suggestion: ${addedButNotSuggested.join(', ')}. Cannot accept values that are not suggested.`
    );
  }
  return addedValues;
}

function readRemovedValues(acceptedSuggestion: AcceptedSuggestion, suggestionValues: string[]) {
  const removedValues = acceptedSuggestion.removedValues || [];
  const removedButSuggested = setIntersection(removedValues, suggestionValues);
  if (removedButSuggested.size > 0) {
    throw new SuggestionAcceptanceError(
      `Some of the removed values exist in the suggestion: ${Array.from(removedButSuggested).join(', ')}. Cannot remove values that are suggested.`
    );
  }
  return removedValues;
}

function mixFinalValues(
  entity: EntitySchema,
  suggestion: IXSuggestionType,
  addedValues: string[],
  removedValues: string[]
) {
  const removedValueSet = new Set(removedValues);
  const entityValues = (entity.metadata?.[suggestion.propertyName] || []).map(
    item => item.value
  ) as string[];
  const newValues = arrayBidirectionalDiff(
    entityValues,
    addedValues,
    v => v,
    v => v
  ).added;
  const finalValues = entityValues.filter(v => !removedValueSet.has(v)).concat(newValues);
  return finalValues;
}

function arrangeValues(
  acceptedSuggestion: AcceptedSuggestion,
  suggestionValues: string[],
  entity: EntitySchema,
  suggestion: IXSuggestionType
) {
  let finalValues: string[] = [];
  if (acceptedSuggestion.addedValues || acceptedSuggestion.removedValues) {
    const addedValues = readAddedValues(acceptedSuggestion, suggestionValues);
    const removedValues = readRemovedValues(acceptedSuggestion, suggestionValues);
    finalValues = mixFinalValues(entity, suggestion, addedValues, removedValues);
  } else {
    finalValues = suggestionValues;
  }
  return finalValues;
}

const valueGetters = {
  _default: (
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>
  ) => [
    {
      value: getRawValue(entity, suggestionsById, acceptedSuggestionsBySharedId),
    },
  ],
  select: (
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>,
    resources: any
  ) => {
    const { thesaurus, translations: translation } = resources;
    const value = getRawValue(entity, suggestionsById, acceptedSuggestionsBySharedId) as string;
    checkValuesInThesaurus([value], thesaurus.name, thesaurus.indexedlabels);

    return mapLabels([value], entity, thesaurus, translation);
  },
  multiselect: (
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>,
    resources: any
  ) => {
    const { thesaurus, translations: translation } = resources;
    const acceptedSuggestion = acceptedSuggestionsBySharedId[entity.sharedId || ''];
    const suggestion = getSuggestion(entity, suggestionsById, acceptedSuggestionsBySharedId);
    const suggestionValues = getRawValue(
      entity,
      suggestionsById,
      acceptedSuggestionsBySharedId
    ) as string[];
    checkValuesInThesaurus(suggestionValues, thesaurus.name, thesaurus.indexedlabels);

    const finalValues: string[] = arrangeValues(
      acceptedSuggestion,
      suggestionValues,
      entity,
      suggestion
    );

    return mapLabels(finalValues, entity, thesaurus, translation);
  },
};

const getValue = (
  property: PropertySchema,
  entity: EntitySchema,
  suggestionsById: Record<IndexTypes, IXSuggestionType>,
  acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>,
  resources: any
) => {
  // @ts-ignore
  const getter = valueGetters[property.type] || valueGetters._default;
  return getter(entity, suggestionsById, acceptedSuggestionsBySharedId, resources);
};

const updateEntitiesWithSuggestion = async (
  allLanguages: boolean,
  acceptedSuggestions: AcceptedSuggestion[],
  suggestions: IXSuggestionType[],
  property: PropertySchema
) => {
  const sharedIds = acceptedSuggestions.map(s => s.sharedId);
  const entityIds = acceptedSuggestions.map(s => s.entityId);
  const { propertyName } = suggestions[0];
  const query = allLanguages
    ? { sharedId: { $in: sharedIds } }
    : { sharedId: { $in: sharedIds }, _id: { $in: entityIds } };
  const storedEntities = await entities.get(query, '+permissions');

  const acceptedSuggestionsBySharedId = objectIndex(
    acceptedSuggestions,
    as => as.sharedId,
    as => as
  );
  const suggestionsById = objectIndex(
    suggestions,
    s => s._id?.toString() || '',
    s => s
  );

  const resources = await fetchResources(property);

  const entitiesToUpdate =
    propertyName !== 'title'
      ? storedEntities.map((entity: EntitySchema) => ({
          ...entity,
          metadata: {
            ...entity.metadata,
            [propertyName]: getValue(
              property,
              entity,
              suggestionsById,
              acceptedSuggestionsBySharedId,
              resources
            ),
          },
          permissions: entity.permissions || [],
        }))
      : storedEntities.map((entity: EntitySchema) => ({
          ...entity,
          title: getRawValue(entity, suggestionsById, acceptedSuggestionsBySharedId),
        }));

  await entities.saveMultiple(entitiesToUpdate);
};

export { updateEntitiesWithSuggestion, SuggestionAcceptanceError };
export type { AcceptedSuggestion };
