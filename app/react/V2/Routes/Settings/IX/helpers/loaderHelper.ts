import { IncomingHttpHeaders } from 'http';
import { get, has, isEmpty } from 'lodash';
import { ClientPropertySchema, ClientEntitySchema } from 'app/istore';
import { search } from 'V2/api/search';
import { PropertySchema } from 'shared/types/commonTypes';
import { ClientTemplateSchema } from 'app/V2/shared/types';
import { SuggestionValue, EntitySuggestion } from '../types';

type TransformedSuggestion = EntitySuggestion & {
  rowId: string;
  disableRowSelection: boolean;
  extractorSource: any;
};

const searchRelatedEntities = async (
  searchString: string,
  targetProperty: ClientPropertySchema | undefined,
  limit = 10,
  headers: IncomingHttpHeaders | undefined = undefined
) => {
  return (
    await search(
      {
        filters: {
          searchString,
        },
        fields: [
          'title',
          'sharedId',
          ...(targetProperty ? [`metadata.${targetProperty.name}`] : []),
        ],
        limit,
      },
      headers
    )
  ).rows;
};

const getPropertyValuesMap = async (
  sharedIds: Set<string>,
  property: PropertySchema,
  targetProperty: ClientPropertySchema | undefined,
  headers: IncomingHttpHeaders | undefined
) => {
  const searchString = `sharedId:(${Array.from(sharedIds)
    .map(id => `${id}`)
    .join(' OR ')})`;

  const searchResult = await searchRelatedEntities(
    searchString,
    targetProperty,
    sharedIds.size,
    headers
  );
  const entityPropertyValuesMap = new Map<string, string>();
  searchResult.forEach((entity: ClientEntitySchema) => {
    if (entity.sharedId) {
      if (property.type === 'relationship' && targetProperty?.name) {
        const label =
          entity.metadata?.[targetProperty.name]?.[0]?.label ||
          (entity.metadata?.[targetProperty.name]?.[0]?.value as string);
        entityPropertyValuesMap.set(entity.sharedId, label || '');
      } else {
        entityPropertyValuesMap.set(entity.sharedId, entity.title || '');
      }
    }
  });
  return entityPropertyValuesMap;
};

const getRelationshipInfo = (
  suggestions: TransformedSuggestion[],
  property: PropertySchema,
  templates: ClientTemplateSchema[]
) => {
  const allCurrentValueIds = new Set<string>();
  const allSuggestedValueIds = new Set<string>();
  suggestions.forEach(suggestion => {
    if (Array.isArray(suggestion.currentValue)) {
      suggestion.currentValue.forEach(value => {
        if (typeof value === 'string') {
          allCurrentValueIds.add(value);
        }
      });
    } else if (typeof suggestion.currentValue === 'string') {
      allCurrentValueIds.add(suggestion.currentValue);
    }
    if (Array.isArray(suggestion.suggestedValue)) {
      suggestion.suggestedValue.forEach(value => {
        if (has(value, 'id')) {
          allSuggestedValueIds.add(get(value, 'id') as string);
        }
      });
    } else if (typeof suggestion.suggestedValue === 'string') {
      allSuggestedValueIds.add(suggestion.suggestedValue);
    }
  });
  let targetProperty: ClientPropertySchema | undefined;
  if (property.inherit) {
    const targetTemplate = templates.find(t => t._id === property.content);
    if (targetTemplate) {
      targetProperty = targetTemplate.properties?.find(
        (p: ClientPropertySchema) => p._id === property.inherit?.property
      );
    }
  }
  return { allCurrentValueIds, targetProperty, allSuggestedValueIds };
};

const updateSuggestionValues = (
  suggestions: TransformedSuggestion[],
  entityCurrentValuesMap: Map<string, string>,
  entitySuggestedValuesMap: Map<string, string>
) => {
  suggestions = suggestions.map(suggestion => {
    const currentValue =
      suggestion.currentValue && !Array.isArray(suggestion.currentValue)
        ? [suggestion.currentValue]
        : ((suggestion.currentValue || []) as SuggestionValue[]);
    const suggestedValue =
      suggestion.suggestedValue && !Array.isArray(suggestion.suggestedValue)
        ? [suggestion.suggestedValue]
        : ((suggestion.suggestedValue || []) as SuggestionValue[]);

    let updatedCurrentValue: EntitySuggestion['currentValue'] = currentValue;
    let updatedSuggestedValue: EntitySuggestion['suggestedValue'] = suggestedValue;

    if (suggestion.currentValue && !isEmpty(currentValue)) {
      updatedCurrentValue = currentValue.map(value => {
        if (typeof value === 'string' && entityCurrentValuesMap.has(value)) {
          return { id: value, label: entityCurrentValuesMap.get(value)! };
        }
        return value;
      });
    }
    if (suggestion.suggestedValue && !isEmpty(suggestedValue)) {
      updatedSuggestedValue = suggestedValue.map(value => {
        const suggestionValue = get(value, 'id') || value;
        if (typeof suggestionValue === 'string' && entitySuggestedValuesMap.has(suggestionValue)) {
          return { id: suggestionValue, label: entitySuggestedValuesMap.get(suggestionValue)! };
        }
        return value;
      });
    }
    return {
      ...suggestion,
      currentValue: updatedCurrentValue,
      suggestedValue: updatedSuggestedValue,
    };
  });
  return suggestions;
};

export { searchRelatedEntities, getPropertyValuesMap, getRelationshipInfo, updateSuggestionValues };
