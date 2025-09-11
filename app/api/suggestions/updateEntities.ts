/* eslint-disable max-statements */
/* eslint-disable max-params */
/* eslint-disable max-lines */
import entities from 'api/entities';
import { checkTypeIsAllowed } from 'api/services/informationextraction/ixextractors';
import thesauri from 'api/thesauri';
import { flatThesaurusValues } from 'api/thesauri/thesauri';
import { ObjectId } from 'mongodb';
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

const MAX_SAVE_RETRIES = 3;

const sleep = async (ms: number) =>
  new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });

const saveEntities = async (entitiesToUpdate: EntitySchema[]) => {
  // eslint-disable-next-line max-statements
  await syncedPromiseLoop(entitiesToUpdate, async (entity: EntitySchema) => {
    let attempt = 0;
    // retry bounded times on save errors (e.g., optimistic lock / concurrent updates)
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await entities.save(entity, { user: {}, language: entity.language });
        break;
      } catch (e) {
        attempt += 1;
        if (attempt >= MAX_SAVE_RETRIES) {
          // eslint-disable-next-line no-console
          console.log('[IX][accept] saveEntities::skipped entity after retries', {
            entityId: (entity as any)?._id?.toString?.(),
            sharedId: entity.sharedId,
            language: (entity as any)?.language,
            attempts: attempt,
            error: (e as Error)?.message,
          });
          // give up on this entity and continue with the rest of the batch
          break;
        }
        // eslint-disable-next-line no-console
        console.log('[IX][accept] saveEntities::retry on error', {
          entityId: (entity as any)?._id?.toString?.(),
          sharedId: entity.sharedId,
          language: (entity as any)?.language,
          attempt,
          error: (e as Error)?.message,
        });
        // small backoff before retrying
        // eslint-disable-next-line no-await-in-loop
        await sleep(100 * attempt);
      }
    }
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
  // eslint-disable-next-line no-console
  console.log('[IX][accept] updateEntities::input', {
    allLanguages,
    propertyName,
    acceptedCount: acceptedSuggestions.length,
    suggestionCount: suggestions.length,
    sharedIds: sharedIds.length,
    entityIds: entityIds.length,
  });
  const storedEntities = await entities.get(query, '+permissions');
  // eslint-disable-next-line no-console
  console.log('[IX][accept] updateEntities::fetched entities', {
    count: storedEntities.length,
    sample: (storedEntities as any[]).slice(0, 3).map(e => ({
      id: e?._id?.toString?.(),
      sharedId: e?.sharedId,
      language: e?.language,
    })),
  });

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
  // eslint-disable-next-line no-console
  console.log('[IX][accept] updateEntities::maps', {
    acceptedByEntityKeys: Object.keys(acceptedSuggestionsByEntityId).length,
    suggestionsByIdKeys: Object.keys(suggestionsById).length,
  });

  const resources = await fetchResources(property, acceptedSuggestions, suggestions);

  // Revert to processing every language entity: values can differ per language.
  // We rely on sequential saves inside entities.updateEntity to avoid lock conflicts.
  const entitiesSource: EntitySchema[] = storedEntities as EntitySchema[];

  const entitiesToUpdate =
    propertyName !== 'title'
      ? (entitiesSource.map((entity: EntitySchema) => ({
          ...entity,
          metadata: {
            ...entity.metadata,
            [propertyName]: (() => {
              const suggestionUsed = getSuggestion(
                entity,
                suggestionsById,
                acceptedSuggestionsByEntityId
              );
              const rawValue = getRawValue(entity, suggestionsById, acceptedSuggestionsByEntityId);
              // eslint-disable-next-line no-console
              console.log('[IX][accept] updateEntities::entity value (metadata)', {
                entityId: (entity as any)?._id?.toString?.(),
                sharedId: entity.sharedId,
                language: (entity as any)?.language,
                suggestionId: suggestionUsed?._id?.toString?.(),
                suggestionValue: suggestionUsed?.suggestedValue,
                rawValue,
                propertyName,
              });
              return getValue(
                property,
                entity,
                suggestionsById,
                acceptedSuggestionsByEntityId,
                resources
              );
            })(),
          },
          permissions: entity.permissions || [],
        })) as EntitySchema[])
      : (entitiesSource.map((entity: EntitySchema) => ({
          ...entity,
          title: (() => {
            const suggestionUsed = getSuggestion(
              entity,
              suggestionsById,
              acceptedSuggestionsByEntityId
            );
            const rawValue = getRawValue(entity, suggestionsById, acceptedSuggestionsByEntityId);
            // eslint-disable-next-line no-console
            console.log('[IX][accept] updateEntities::entity value (title)', {
              entityId: (entity as any)?._id?.toString?.(),
              sharedId: entity.sharedId,
              language: (entity as any)?.language,
              suggestionId: suggestionUsed?._id?.toString?.(),
              suggestionValue: suggestionUsed?.suggestedValue,
              rawValue,
              propertyName,
            });
            return rawValue as any;
          })(),
        })) as EntitySchema[]);

  await saveEntities(entitiesToUpdate);
};

export { updateEntitiesWithSuggestion, SuggestionAcceptanceError };
export type { AcceptedSuggestion };
