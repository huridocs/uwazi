import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { acceptEntitySuggestion } from 'app/MetadataExtraction/SuggestionsAPI';

export function acceptSuggestion(suggestion: {}) {
  return async (dispatch: Dispatch<IStore>) => {
    const result = await acceptEntitySuggestion(request);
    if (result.success) {
      dispatch(notificationActions.notify('Saved successfully.', 'success'));
    }
  };
}
