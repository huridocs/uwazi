/* eslint-disable max-statements */
import { ClientEntitySchema } from 'app/istore';
import { EntitySuggestionType } from 'shared/types/suggestionType';

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
  } else if (updatedEntity.metadata && updatedEntity.metadata[propertyToUpdate]?.length) {
    const newValue = updatedEntity.metadata[propertyToUpdate]![0].value;
    suggestionToUpdate.currentValue = newValue;
    suggestionToUpdate.state.match = suggestionToUpdate.suggestedValue === newValue;
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
  updatedSuggestions: EntitySuggestionType[] | []
): EntitySuggestionType[] => {
  if (!updatedSuggestions.length) {
    return currentSuggestions;
  }

  return currentSuggestions;
};

export { updateSuggestions, updateSuggestionsByEntity };
