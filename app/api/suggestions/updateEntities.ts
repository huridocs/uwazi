import entities from 'api/entities';
import { checkTypeIsAllowed } from 'api/services/informationextraction/ixextractors';
import templates from 'api/templates';
import thesauri from 'api/thesauri';
import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { arrayBidirectionalDiff } from 'shared/data_utils/arrayBidirectionalDiff';
import { IndexTypes, objectIndex } from 'shared/data_utils/objectIndex';
import { syncedPromiseLoop } from 'shared/data_utils/promiseUtils';
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

const fetchNoResources = async () => ({});

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

const fetchEntitySharedIds = async (
  _property: PropertySchema,
  acceptedSuggestions: AcceptedSuggestion[],
  suggestions: IXSuggestionType[]
) => {
  const suggestionSharedIds = suggestions.map(s => s.suggestedValue).flat();
  const addedSharedIds = acceptedSuggestions.map(s => s.addedValues || []).flat();
  const expectedSharedIds = Array.from(new Set(suggestionSharedIds.concat(addedSharedIds)));
  const entitiesInDb = await entities.get({ sharedId: { $in: expectedSharedIds } }, ['sharedId']);
  const sharedIdsInDb = new Set(entitiesInDb.map((e: any) => e.sharedId));
  return { sharedIdsInDb };
};

const fetchSelectResources = async (property: PropertySchema) => {
  const thesaurus = await fetchThesaurus(property.content);
  return { thesaurus };
};

const resourceFetchers = {
  title: fetchNoResources,
  text: fetchNoResources,
  numeric: fetchNoResources,
  date: fetchNoResources,
  select: fetchSelectResources,
  multiselect: fetchSelectResources,
  relationship: fetchEntitySharedIds,
};

const fetchResources = async (
  property: PropertySchema,
  acceptedSuggestions: AcceptedSuggestion[],
  suggestions: IXSuggestionType[]
) => {
  const type = checkTypeIsAllowed(property.type);
  const fetcher = resourceFetchers[type];
  return fetcher(property, acceptedSuggestions, suggestions);
};

const getAcceptedSuggestion = (
  entity: EntitySchema,
  acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>
): AcceptedSuggestion => acceptedSuggestionsBySharedId[entity.sharedId || ''];

const getSuggestion = (
  entity: EntitySchema,
  suggestionsById: Record<IndexTypes, IXSuggestionType>,
  acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>
) => suggestionsById[getAcceptedSuggestion(entity, acceptedSuggestionsBySharedId)._id.toString()];

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

function arrangeAddedOrRemovedValues(
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

function checkSharedIds(values: string[], sharedIdsInDb: Set<string>) {
  const missingSharedIds = values.filter(v => !sharedIdsInDb.has(v));
  if (missingSharedIds.length > 0) {
    throw new SuggestionAcceptanceError(
      `The following sharedIds do not exist in the database: ${missingSharedIds.join(', ')}.`
    );
  }
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
    const { thesaurus } = resources;
    const value = getRawValue(entity, suggestionsById, acceptedSuggestionsBySharedId) as string;
    checkValuesInThesaurus([value], thesaurus.name, thesaurus.indexedlabels);

    return [{ value }];
  },
  multiselect: (
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>,
    resources: any
  ) => {
    const { thesaurus } = resources;
    const acceptedSuggestion = getAcceptedSuggestion(entity, acceptedSuggestionsBySharedId);
    const suggestion = getSuggestion(entity, suggestionsById, acceptedSuggestionsBySharedId);
    const suggestionValues = getRawValue(
      entity,
      suggestionsById,
      acceptedSuggestionsBySharedId
    ) as string[];
    checkValuesInThesaurus(suggestionValues, thesaurus.name, thesaurus.indexedlabels);

    const finalValues: string[] = arrangeAddedOrRemovedValues(
      acceptedSuggestion,
      suggestionValues,
      entity,
      suggestion
    );

    return finalValues.map(value => ({ value }));
  },
  relationship: (
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsBySharedId: Record<IndexTypes, AcceptedSuggestion>,
    resources: any
  ) => {
    const { sharedIdsInDb } = resources;

    const acceptedSuggestion = getAcceptedSuggestion(entity, acceptedSuggestionsBySharedId);
    const suggestion = getSuggestion(entity, suggestionsById, acceptedSuggestionsBySharedId);
    const suggestionValues = getRawValue(
      entity,
      suggestionsById,
      acceptedSuggestionsBySharedId
    ) as string[];
    checkSharedIds(suggestionValues, sharedIdsInDb);

    const finalValues: string[] = arrangeAddedOrRemovedValues(
      acceptedSuggestion,
      suggestionValues,
      entity,
      suggestion
    );

    return finalValues.map(value => ({ value }));
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

const updateEntities = async (entitiesToUpdate: EntitySchema[]) => {
  const templateIds = entitiesToUpdate.map(e => e.template).filter(id => id) as ObjectIdSchema[];
  const templatesInDb = await templates.get({ _id: { $in: templateIds } });
  const templatesById = objectIndex(
    templatesInDb,
    t => t._id.toString(),
    t => t
  );
  await syncedPromiseLoop(entitiesToUpdate, async (entity: EntitySchema) => {
    const template = templatesById[entity.template?.toString() || ''];
    if (!template) return;
    await entities.updateEntity(entities.sanitize(entity, template), template, true);
  });
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

  const resources = await fetchResources(property, acceptedSuggestions, suggestions);

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

  await updateEntities(entitiesToUpdate);
};

export { updateEntitiesWithSuggestion, SuggestionAcceptanceError };
export type { AcceptedSuggestion };
