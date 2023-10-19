import { ClientEntitySchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';

// eslint-disable-next-line max-statements
const updateSuggestionsByEntity = (
  currentSuggestions: EntitySuggestionType[],
  updatedEntity?: ClientEntitySchema
): EntitySuggestionType[] => {
  if (!updatedEntity) {
    return currentSuggestions;
  }

  const suggestionToUpdate = currentSuggestions.find(
    currentSuggestion => currentSuggestion.entityId === updatedEntity._id
  );

  const propertyToUpdate = suggestionToUpdate?.propertyName;

  if (!suggestionToUpdate || !propertyToUpdate) {
    return currentSuggestions;
  }

  if (propertyToUpdate === 'title' && updatedEntity.title) {
    const newTitle = updatedEntity.title;
    suggestionToUpdate.currentValue = newTitle;
    suggestionToUpdate.entityTitle = newTitle;
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === newTitle;
  }

  if (
    propertyToUpdate !== 'title' &&
    updatedEntity.metadata &&
    updatedEntity.metadata[propertyToUpdate]?.length
  ) {
    const newValue = updatedEntity.metadata[propertyToUpdate]![0].value;
    suggestionToUpdate.currentValue = newValue;
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === newValue;
  }

  if (
    propertyToUpdate !== 'title' &&
    (!updatedEntity.metadata || !updatedEntity.metadata[propertyToUpdate]?.length)
  ) {
    suggestionToUpdate.currentValue = '';
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === '';
  }

  const suggestions = currentSuggestions.map(currentSuggestion => {
    if (currentSuggestion._id === suggestionToUpdate._id) {
      return suggestionToUpdate;
    }
    return currentSuggestion;
  });

  return suggestions;
};

const updateSuggestions = (
  currentSuggestions: EntitySuggestionType[],
  suggestionsToAccept: EntitySuggestionType[] | []
): EntitySuggestionType[] => {
  if (!suggestionsToAccept.length) {
    return currentSuggestions;
  }

  const acceptedSuggestions = suggestionsToAccept.map(suggestionToAccept => {
    const updated = { ...suggestionToAccept };
    updated.state.match = true;
    updated.currentValue = suggestionToAccept.suggestedValue;

    if (
      suggestionToAccept.propertyName === 'title' &&
      typeof suggestionToAccept.suggestedValue === 'string'
    ) {
      updated.entityTitle = suggestionToAccept.suggestedValue;
    }

    return updated;
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

export { updateSuggestions, updateSuggestionsByEntity };
