import { actions } from 'app/BasicReducer';
import { t } from 'app/I18N';
import * as notifications from 'app/Notifications/actions/notificationsActions';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import api from 'app/utils/api';
import { RequestParams } from 'app/utils/RequestParams';
import { Dispatch } from 'redux';
import { TaskStatus } from 'shared/tasks/tasks';
import { IImmutable } from 'shared/types/Immutable';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { PropertySchema } from '../../../shared/types/commonTypes';
import { ClassifierModelSchema } from '../types/classifierModelType';
import { LabelCountSchema } from '../types/labelCountType';

export interface TaskState {
  SyncState?: TaskStatus;
  TrainState?: TaskStatus;
}

export interface SuggestInfo {
  model: ClassifierModelSchema;
  docsWithLabels: LabelCountSchema;
  docsWithSuggestionsForPublish: LabelCountSchema;
  docsWithSuggestionsForReview: LabelCountSchema;
}

export type ThesaurusWithProperty = ThesaurusSchema & { property?: PropertySchema };

export interface ThesaurusCockpitStore {
  thesauri: {
    thesaurus: IImmutable<ThesaurusWithProperty>;
    suggestInfo: IImmutable<SuggestInfo>;
    taskState: IImmutable<TaskState>;
  };
}

export function toggleEnableClassification() {
  return async (
    dispatch: Dispatch<ThesaurusCockpitStore>,
    getState: () => ThesaurusCockpitStore
  ) => {
    const { property, ...thesaurus } = getState().thesauri.thesaurus.toJS();
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
    dispatch(
      actions.set('thesauri.thesaurus', {
        ..._updatedThesaurus,
        property,
      })
    );
  };
}

export function updateTaskState(thesaurusName: string) {
  return async (dispatch: Dispatch<ThesaurusCockpitStore>) => {
    const syncState = await api.get(
      'tasks',
      new RequestParams({ name: 'TopicClassificationSync' })
    );
    const trainState = await ThesauriAPI.getModelTrainStatus(
      new RequestParams({ thesaurus: thesaurusName })
    );
    dispatch(
      actions.set('thesauri.taskState', { SyncState: syncState.json, TrainState: trainState })
    );
  };
}

export function startTraining(thesaurusId: string) {
  return async (_dispatch: Dispatch<ThesaurusCockpitStore>) => {
    console.log(await ThesauriAPI.trainModel(new RequestParams({ thesaurusId })));
  };
}
