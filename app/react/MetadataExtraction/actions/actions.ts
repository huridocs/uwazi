import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { notificationActions } from 'app/Notifications';
import { acceptEntitySuggestion } from 'app/MetadataExtraction/SuggestionsAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { EntitySuggestionType } from 'shared/types/suggestionType';

const acceptSuggestion =
  (suggestion: EntitySuggestionType, allLanguages: boolean) =>
  async (dispatch: Dispatch<IStore>) => {
    const params = new RequestParams({
      allLanguages,
      suggestion: {
        _id: suggestion._id,
        sharedId: suggestion.sharedId,
        entityId: suggestion.entityId,
      },
    });
    const result = await acceptEntitySuggestion(params);
    if (result.success) {
      dispatch(notificationActions.notify('Saved successfully.', 'success'));
    }
  };

export { acceptSuggestion };
