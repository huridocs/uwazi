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
import { IXExtractorInfo } from 'V2/shared/types';
import {
  getAllExtractors,
  createExtractor as createExtractorAPICall,
  deleteExtractors as deleteExtractorsAPICall,
} from '../SuggestionsAPI';

const loadExtractors = () => async (dispatch: any) => {
  const extractors = await getAllExtractors(new RequestParams());
  dispatch(actions.set('ixExtractors', extractors));
};

const loadExtractor = async (query: { id: string }, headers = {}): Promise<IXExtractorInfo[]> => {
  const extractors = await getAllExtractors(new RequestParams(query, headers));
  return extractors;
};

const createExtractor = (newExtractorInfo: IXExtractorInfo) => async (dispatch: any) => {
  const extractor = await createExtractorAPICall(new RequestParams(newExtractorInfo));
  dispatch(actions.push('ixExtractors', extractor));
};

const deleteExtractors =
  (currentExtractors: IXExtractorInfo[], extractorIds: string[]) => async (dispatch: any) => {
    await deleteExtractorsAPICall(new RequestParams({ ids: extractorIds }));
    const idSet = new Set(extractorIds);
    const newExtractors = currentExtractors.filter(
      (extractor: IXExtractorInfo) => extractor._id && !idSet.has(extractor._id)
    );
    dispatch(actions.set('ixExtractors', newExtractors));
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
      dispatch(
        notificationActions.notify(t('System', 'Saved successfully.', null, false), 'success')
      );
    }
  };

export {
  acceptSuggestion,
  loadExtractors,
  loadExtractor,
  createExtractor,
  deleteExtractors,
  fetchEntity,
  fetchFile,
  scrollToPage,
};
