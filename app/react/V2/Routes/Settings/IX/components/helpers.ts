/* eslint-disable max-statements */
import { ClientEntitySchema } from 'app/istore';
import { PropertySchema } from 'shared/types/commonTypes';
import { ChildrenSuggestion, SuggestionValue, TableSuggestion } from '../types';

const generateChildrenRows = (_suggestion: TableSuggestion) => {
  const suggestion: TableSuggestion = { ..._suggestion };

  const currentValues = [
    ...(Array.isArray(suggestion.currentValue) ? suggestion.currentValue : []),
  ];

  const suggestedValues = [
    ...(Array.isArray(suggestion.suggestedValue) ? suggestion.suggestedValue : []),
  ];

  suggestion.children = [];

  suggestedValues.forEach(suggestedValue => {
    const valuePresent = currentValues.find(v => v === suggestedValue);
    if (valuePresent) {
      currentValues.splice(currentValues.indexOf(valuePresent), 1);
    }

    suggestion.children?.push({
      suggestedValue,
      currentValue: valuePresent || '',
      propertyName: suggestion.propertyName,
      disableRowSelection: true,
      entityId: suggestion.entityId,
      _id: suggestion._id,
      isChild: true,
      sharedId: suggestion.sharedId,
    });
  });

  currentValues.forEach(currentValue => {
    suggestion.children?.push({
      suggestedValue: '',
      currentValue,
      propertyName: suggestion.propertyName,
      disableRowSelection: true,
      entityId: suggestion.entityId,
      _id: suggestion._id,
      isChild: true,
      sharedId: suggestion.sharedId,
    });
  });

  return suggestion;
};

const _replaceSuggestion = (suggestion: TableSuggestion, currentSuggestions: TableSuggestion[]) =>
  currentSuggestions.map(currentSuggestion => {
    if (currentSuggestion._id === suggestion._id) {
      return suggestion;
    }
    return currentSuggestion;
  });

const _updateTitleInSuggestion = (
  currentSuggestions: TableSuggestion[],
  _suggestionToUpdate: TableSuggestion,
  updatedEntity: ClientEntitySchema
) => {
  const suggestionToUpdate = { ..._suggestionToUpdate };
  const newTitle = updatedEntity.title;
  suggestionToUpdate.currentValue = newTitle;
  suggestionToUpdate.entityTitle = newTitle!;
  suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === newTitle;

  return _replaceSuggestion(suggestionToUpdate, currentSuggestions);
};

// eslint-disable-next-line max-statements
const updateSuggestionsByEntity = (
  currentSuggestions: TableSuggestion[],
  updatedEntity?: ClientEntitySchema,
  property?: PropertySchema
): TableSuggestion[] => {
  if (!updatedEntity) {
    return currentSuggestions;
  }

  let suggestionToUpdate = currentSuggestions.find(
    currentSuggestion => currentSuggestion.entityId === updatedEntity._id
  );

  const propertyToUpdate = suggestionToUpdate?.propertyName;

  if (!suggestionToUpdate || !propertyToUpdate) {
    return currentSuggestions;
  }

  if (propertyToUpdate === 'title' && updatedEntity.title) {
    return _updateTitleInSuggestion(currentSuggestions, suggestionToUpdate, updatedEntity);
  }

  if (!updatedEntity.metadata) {
    return currentSuggestions;
  }

  if (updatedEntity.metadata[propertyToUpdate]?.length) {
    const newValue = (
      property?.type === 'multiselect'
        ? updatedEntity.metadata[propertyToUpdate]?.map(v => v.value)
        : updatedEntity.metadata[propertyToUpdate]![0].value
    ) as SuggestionValue;

    suggestionToUpdate.currentValue = newValue;
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === newValue;
  }

  if (!updatedEntity.metadata[propertyToUpdate]?.length) {
    suggestionToUpdate.currentValue = '';
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === '';
  }

  if (property?.type === 'multiselect') {
    suggestionToUpdate = generateChildrenRows(suggestionToUpdate);
  }

  return _replaceSuggestion(suggestionToUpdate, currentSuggestions);
};

const updateMultiValueSuggestions = (
  _parentSuggestion: TableSuggestion,
  acceptedSuggestion: ChildrenSuggestion
): TableSuggestion => {
  let parentSuggestion = { ..._parentSuggestion };

  const shouldAddValue = acceptedSuggestion.suggestedValue !== '';
  const value = shouldAddValue
    ? acceptedSuggestion.suggestedValue || ''
    : acceptedSuggestion.currentValue || '';

  parentSuggestion.currentValue = (_parentSuggestion.currentValue as SuggestionValue[]) || [];
  parentSuggestion.currentValue = shouldAddValue
    ? parentSuggestion.currentValue.concat(value)
    : parentSuggestion.currentValue.filter(v => v !== value);

  parentSuggestion.state.match = parentSuggestion.currentValue.every(v =>
    parentSuggestion.suggestedValue.includes(v)
  );

  parentSuggestion = generateChildrenRows(parentSuggestion);
  return parentSuggestion;
};

const updateSuggestions = (
  currentSuggestions: TableSuggestion[],
  suggestionsToAccept: TableSuggestion[] | ChildrenSuggestion[]
): TableSuggestion[] => {
  if (!suggestionsToAccept.length) {
    return currentSuggestions;
  }

  const acceptedSuggestions = suggestionsToAccept.map(acceptedSuggestion => {
    let suggestion = acceptedSuggestion.isChild
      ? { ...(currentSuggestions.find(s => s._id === acceptedSuggestion._id) as TableSuggestion) }
      : { ...(acceptedSuggestion as TableSuggestion) };

    if (acceptedSuggestion.isChild) {
      suggestion = updateMultiValueSuggestions(
        suggestion,
        acceptedSuggestion as ChildrenSuggestion
      );
    } else {
      suggestion.state.match = true;
      suggestion.currentValue = acceptedSuggestion.suggestedValue;
    }

    if (
      acceptedSuggestion.propertyName === 'title' &&
      typeof acceptedSuggestion.suggestedValue === 'string'
    ) {
      suggestion.entityTitle = acceptedSuggestion.suggestedValue;
    }
    return suggestion;
  });

  const merged = [
    ...currentSuggestions
      .concat(acceptedSuggestions)
      .reduce(
        (map, suggestion) =>
          map.set(suggestion._id, Object.assign(map.get(suggestion._id) || {}, suggestion)),
        new Map()
      )
      .values(),
  ];

  return merged;
};

export { updateSuggestions, updateSuggestionsByEntity, generateChildrenRows };
