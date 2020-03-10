import { actions } from 'app/BasicReducer';
import { t } from 'app/I18N';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Dispatch } from 'redux';
import { IStore } from 'app/istore';

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

export function updateTaskState() {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const thesaurus = getState().thesauri.thesaurus.toJS();
    const syncState = await api.get(
      'tasks',
      new RequestParams({ name: 'TopicClassificationSync' })
    );
    const trainState = await ThesauriAPI.getModelTrainStatus(
      new RequestParams({ thesaurus: thesaurus.name })
    );
    dispatch(
      actions.set('thesauri.taskState', { SyncState: syncState.json, TrainState: trainState })
    );
  };
}

export function startTraining() {
  return async (dispatch: Dispatch<IStore>, getState: () => IStore) => {
    const thesaurus = getState().thesauri.thesaurus.toJS();
    await ThesauriAPI.trainModel(new RequestParams({ thesaurusId: thesaurus._id!.toString() }));
    await dispatch(updateTaskState());
  };
}
