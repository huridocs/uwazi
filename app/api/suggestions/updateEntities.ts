/* eslint-disable max-statements */
/* eslint-disable max-params */
/* eslint-disable max-lines */
import entities from 'api/entities';
import { ArrayUtils } from 'api/common.v2/utils/Array';
import { LoggerFactory } from 'api/core/infrastructure/factories/LoggerFactory';
import { checkTypeIsAllowed } from 'api/services/informationextraction/ixextractors';
import thesauri from 'api/thesauri';
import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { ObjectId } from 'mongodb';
import { tenants } from 'api/tenants/tenantContext';
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

type EntityInfo = Record<string, { sharedId: string; template: ObjectId }>;

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

const fetchEntityInfo = async (
  _property: PropertySchema,
  acceptedSuggestions: AcceptedSuggestion[],
  suggestions: IXSuggestionType[]
): Promise<{ entityInfo: EntityInfo }> => {
  const suggestionSharedIds = suggestions
    .map(s => {
      const { suggestedValue } = s;
      if (
        Array.isArray(suggestedValue) &&
        suggestedValue.length > 0 &&
        typeof suggestedValue[0] === 'object' &&
        suggestedValue[0] &&
        'id' in suggestedValue[0]
      ) {
        return suggestedValue.map(item => (item as any).id);
      }
      return suggestedValue;
    })
    .flat();
  const addedSharedIds = acceptedSuggestions.map(s => s.addedValues || []).flat();
  const expectedSharedIds = Array.from(new Set(suggestionSharedIds.concat(addedSharedIds)));
  const entitiesInDb = (await entities.get({ sharedId: { $in: expectedSharedIds } }, [
    'sharedId',
    'template',
  ])) as { sharedId: string; template: ObjectId }[];
  const indexedBySharedId = objectIndex(
    entitiesInDb,
    e => e.sharedId,
    e => e
  );
  return { entityInfo: indexedBySharedId };
};

const fetchSelectResources = async (property: PropertySchema) => {
  const thesaurus = await fetchThesaurus(property.content);
  return { thesaurus };
};

const resourceFetchers = {
  title: fetchNoResources,
  markdown: fetchNoResources,
  text: fetchNoResources,
  numeric: fetchNoResources,
  date: fetchNoResources,
  select: fetchSelectResources,
  multiselect: fetchSelectResources,
  relationship: fetchEntityInfo,
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
  acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>
): AcceptedSuggestion => acceptedSuggestionsByEntityId[entity._id?.toString() || ''];

const getSuggestion = (
  entity: EntitySchema,
  suggestionsById: Record<IndexTypes, IXSuggestionType>,
  acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>
) => suggestionsById[getAcceptedSuggestion(entity, acceptedSuggestionsByEntityId)._id.toString()];

const getRawValue = (
  entity: EntitySchema,
  suggestionsById: Record<IndexTypes, IXSuggestionType>,
  acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>
) => {
  const suggestion = getSuggestion(entity, suggestionsById, acceptedSuggestionsByEntityId);
  if (!suggestion) return undefined;
  const { suggestedValue } = suggestion;
  if (
    Array.isArray(suggestedValue) &&
    suggestedValue.length > 0 &&
    typeof suggestedValue[0] === 'object' &&
    suggestedValue[0] &&
    'id' in suggestedValue[0]
  ) {
    return suggestedValue.map(item => (item as any).id);
  }
  return suggestedValue;
};

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

function checkSharedIds(values: string[], entityInfo: EntityInfo) {
  const missingSharedIds = values.filter(v => !(v in entityInfo));
  if (missingSharedIds.length > 0) {
    throw new SuggestionAcceptanceError(
      `The following sharedIds do not exist in the database: ${missingSharedIds.join(', ')}.`
    );
  }
}

function checkTemplates(property: PropertySchema, values: string[], entityInfo: EntityInfo) {
  const { content } = property;
  if (!content) return;
  const templateId = new ObjectId(content);
  const wrongTemplatedSharedIds = values.filter(
    v => entityInfo[v].template.toString() !== templateId.toString()
  );
  if (wrongTemplatedSharedIds.length > 0) {
    throw new SuggestionAcceptanceError(
      `The following sharedIds do not match the content template in the relationship property: ${wrongTemplatedSharedIds.join(', ')}.`
    );
  }
}

const getRawValueAsArray = (
  _property: PropertySchema,
  entity: EntitySchema,
  suggestionsById: Record<IndexTypes, IXSuggestionType>,
  acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>
) => [
  {
    value: getRawValue(entity, suggestionsById, acceptedSuggestionsByEntityId),
  },
];

const valueGetters = {
  text: getRawValueAsArray,
  markdown: getRawValueAsArray,
  date: getRawValueAsArray,
  numeric: getRawValueAsArray,
  select: (
    _property: PropertySchema,
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>,
    resources: any
  ) => {
    const { thesaurus } = resources;
    const value = getRawValue(entity, suggestionsById, acceptedSuggestionsByEntityId) as string;
    checkValuesInThesaurus([value], thesaurus.name, thesaurus.indexedlabels);

    return [{ value }];
  },
  multiselect: (
    _property: PropertySchema,
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>,
    resources: any
  ) => {
    const { thesaurus } = resources;
    const acceptedSuggestion = getAcceptedSuggestion(entity, acceptedSuggestionsByEntityId);
    const suggestion = getSuggestion(entity, suggestionsById, acceptedSuggestionsByEntityId);
    const suggestionValues = getRawValue(
      entity,
      suggestionsById,
      acceptedSuggestionsByEntityId
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
    property: PropertySchema,
    entity: EntitySchema,
    suggestionsById: Record<IndexTypes, IXSuggestionType>,
    acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>,
    resources: any
  ) => {
    const { entityInfo } = resources;

    const acceptedSuggestion = getAcceptedSuggestion(entity, acceptedSuggestionsByEntityId);
    const suggestion = getSuggestion(entity, suggestionsById, acceptedSuggestionsByEntityId);
    const suggestionValues = getRawValue(
      entity,
      suggestionsById,
      acceptedSuggestionsByEntityId
    ) as string[];
    checkSharedIds(suggestionValues, entityInfo);
    checkTemplates(property, suggestionValues, entityInfo);

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
  acceptedSuggestionsByEntityId: Record<IndexTypes, AcceptedSuggestion>,
  resources: any
) => {
  const type = checkTypeIsAllowed(property.type);
  if (type === 'title') {
    throw new SuggestionAcceptanceError('Title should not be handled here.');
  }
  const getter = valueGetters[type];
  return getter(property, entity, suggestionsById, acceptedSuggestionsByEntityId, resources);
};

const updateEntitiesWithSuggestion = async (
  _allLanguages: boolean, // remove, no longer used
  acceptedSuggestions: AcceptedSuggestion[],
  suggestions: IXSuggestionType[],
  property: PropertySchema
) => {
  const { propertyName } = suggestions[0];

  const acceptedSuggestionsByEntityId = objectIndex(
    acceptedSuggestions,
    as => as.entityId,
    as => as
  );
  const suggestionsById = objectIndex(
    suggestions,
    s => s._id?.toString() || '',
    s => s
  );

  const resources = await fetchResources(property, acceptedSuggestions, suggestions);

  // Process per accepted suggestion: fetch fresh entity, compute value, save sequentially
  await ArrayUtils.sequentialFor(acceptedSuggestions, async as => {
    try {
      const [current] = (await entities.get(
        { _id: new ObjectId(as.entityId) },
        '+permissions'
      )) as EntitySchema[];
      if (!current) {
        LoggerFactory.default().info('IX accept: entity not found for update', {
          entityId: as.entityId,
          sharedId: as.sharedId,
        });
        return;
      }

      const updated =
        propertyName !== 'title'
          ? {
              ...current,
              metadata: {
                ...current.metadata,
                [propertyName]: getValue(
                  property,
                  current,
                  suggestionsById,
                  acceptedSuggestionsByEntityId,
                  resources
                ),
              },
              permissions: current.permissions || [],
            }
          : {
              ...current,
              title: getRawValue(current, suggestionsById, acceptedSuggestionsByEntityId),
            };

      await entities.save(updated, { user: {}, language: current.language });
    } catch (e) {
      if (e instanceof SuggestionAcceptanceError) {
        throw e; // bubble validation errors (e.g., invalid select IDs)
      }
      LoggerFactory.default().error('IX accept: failed to save entity during updateEntities', {
        tenant: tenants.current()?.name,
        entityId: as.entityId,
        sharedId: as.sharedId,
        suggestionId: as._id?.toString?.() || as._id,
        propertyName,
        error: (e as Error)?.message,
      });
    }
  });
};

export { updateEntitiesWithSuggestion, SuggestionAcceptanceError };
export type { AcceptedSuggestion };
