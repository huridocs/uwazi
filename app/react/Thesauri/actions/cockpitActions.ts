import { actions } from 'app/BasicReducer';
import { t } from 'app/I18N';
import { IStore, ThesaurusSuggestions } from 'app/istore';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import SearchAPI from 'app/Search/SearchAPI';
import {
  getLabelsQuery,
  getReadyToPublishSuggestionsQuery,
  getReadyToReviewSuggestionsQuery,
} from 'app/Settings/utils/suggestions';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Dispatch } from 'redux';
import { PropertySchema } from 'shared/types/commonTypes';
import { LabelCountSchema } from '../types/labelCountType';
import { buildLabelCounts, flattenLabelCounts } from '../utils/suggestionQuery';

export function toggleEnableClassification() {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const thesaurus = getState().thesauri.thesaurus.toJS();
    thesaurus.enable_classification = !thesaurus.enable_classification;
    const _updatedThesaurus = await ThesauriAPI.save(new RequestParams(thesaurus));
    dispatch(
      notifications.notify(
        t(
          'System',
          thesaurus.enable_classification
            ? `You will now see suggestions for ${_updatedThesaurus.name}.`
            : `You will no longer see suggestions for ${_updatedThesaurus.name}.`,
          null,
          false
        ),
        'success'
      )
    );
    dispatch(actions.set('thesauri.thesaurus', _updatedThesaurus));
  };
}

async function getAndPopulateLabelCounts(
  templates: { _id: string }[],
  queryBuilderFunc: (id: string, prop: PropertySchema) => any,
  assocProp?: PropertySchema,
  countSuggestions: boolean = true
): Promise<LabelCountSchema> {
  if (!assocProp) {
    return { totalRows: 0, totalLabels: 0, thesaurus: { propertyName: '', totalValues: {} } };
  }
  const docsWithSuggestions = await Promise.all(
    templates.map((template: { _id: string }) => {
      const reqParams = new RequestParams(queryBuilderFunc(template._id, assocProp));
      return SearchAPI.search(reqParams);
    })
  );
  const sanitizedSuggestionsTBPublished = docsWithSuggestions.map((s: any) =>
    buildLabelCounts(s, assocProp?.name ?? '', countSuggestions)
  );
  return flattenLabelCounts(sanitizedSuggestionsTBPublished, assocProp?.name ?? '');
}

export function updateCockpitData(_serverRequestParams?: RequestParams) {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const requestParams = _serverRequestParams ?? new RequestParams();
    const state = getState();
    const thesaurus = state.thesauri.thesaurus.toJS();
    const templates = state.templates.toJS();
    const assocProp = state.thesauri.suggestInfo.get('property')?.toJS();
    const [
      syncState,
      trainState,
      model,
      docsWithSuggestionsForPublish,
      docsWithSuggestionsForReview,
      docsWithLabels,
    ] = await Promise.all([
      api.get('tasks', requestParams.set({ name: 'TopicClassificationSync' })),
      ThesauriAPI.getModelTrainStatus(requestParams.set({ thesaurus: thesaurus.name })),
      ThesauriAPI.getModelStatus(requestParams.set({ thesaurus: thesaurus.name })),
      getAndPopulateLabelCounts(templates, getReadyToPublishSuggestionsQuery, assocProp),
      getAndPopulateLabelCounts(templates, getReadyToReviewSuggestionsQuery, assocProp),
      getAndPopulateLabelCounts(templates, getLabelsQuery, assocProp, false),
    ]);
    dispatch(
      actions.set('thesauri.suggestInfo', {
        model,
        property: assocProp,
        docsWithSuggestionsForPublish,
        docsWithSuggestionsForReview,
        docsWithLabels,
      } as ThesaurusSuggestions)
    );
    dispatch(
      actions.set('thesauri.tasksState', { SyncState: syncState.json, TrainState: trainState })
    );
  };
}

export function startTraining() {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const thesaurus = getState().thesauri.thesaurus.toJS();
    await ThesauriAPI.trainModel(new RequestParams({ thesaurusId: thesaurus._id!.toString() }));
    await dispatch(updateCockpitData());
  };
}
