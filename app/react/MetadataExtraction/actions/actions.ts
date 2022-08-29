import { Dispatch } from 'redux';
import { IStore } from 'app/istore';
import { t } from 'app/I18N';
import { notificationActions } from 'app/Notifications';
import { EntitySuggestionType } from 'shared/types/suggestionType';
import { RequestParams } from 'app/utils/RequestParams';
import api from 'app/utils/api';
import { acceptEntitySuggestion } from 'app/MetadataExtraction/SuggestionsAPI';
import EntitiesAPI from 'app/Entities/EntitiesAPI';
import scroller from 'app/Viewer/utils/Scroller';
import { actions } from 'app/BasicReducer';
import { saveConfigurations as saveConfigs } from '../SuggestionsAPI';
import { IXTemplateConfiguration } from '../PropertyConfigurationModal';

const saveConfigurations =
  (newSettingsConfigs: IXTemplateConfiguration[]) => async (dispatch: any) => {
    const settings = await saveConfigs(new RequestParams(newSettingsConfigs));
    dispatch(actions.set('settings/collection', settings));
    dispatch(notificationActions.notify(t('System', 'Settings updated'), 'success'));
  };

const fetchEntity = async (entityId: string, language: string) => {
  const entityRequest = new RequestParams({ _id: entityId });
  return EntitiesAPI.get(entityRequest, language);
};

const fetchFile = async (fileId: string) => {
  const fileRequest = new RequestParams({ _id: fileId });
  return api.get('files', fileRequest);
};

const scrollToPage = async (pageNumber: number) =>
  scroller.to(`.document-viewer div#page-${pageNumber}`, '.document-viewer', {
    duration: 0,
    dividerOffset: 1,
    offset: 50,
  });

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

export { acceptSuggestion, fetchEntity, fetchFile, scrollToPage, saveConfigurations };
