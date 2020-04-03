import { actions } from 'app/BasicReducer';
import { ThesaurusSuggestions } from 'app/istore';
import SearchAPI from 'app/Search/SearchAPI';
import { store } from 'app/store';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import api from 'app/utils/api';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import * as cockpitActions from '../cockpitActions';
import { TasksState } from '../../../istore';

const thesauri: ThesaurusSchema[] = [
  {
    _id: 'abc',
    name: 'thesaurus1',
    enable_classification: false,
    values: [
      { id: 'v1', label: 'V1' },
      { id: 'v2', label: 'V2' },
    ],
  },
];
const templates: TemplateSchema[] = [
  {
    _id: 't1',
    name: 'template1',
    commonProperties: [{ name: 'title', label: 'Title', type: 'text' }],
    properties: [{ name: 'opts', label: 'Opts', content: 'abc', type: 'multiselect' }],
  },
];
const rawSuggestionResult = {
  totalRows: 1,
  aggregations: {
    all: {
      __opts: {
        buckets: [
          {
            key: 'v1',
            filtered: {
              doc_count: 2,
            },
          },
          {
            key: 'v2',
            filtered: {
              doc_count: 0,
            },
          },
        ],
      },
    },
  },
};

describe('cockpitActions', () => {
  beforeEach(() => {
    store!.dispatch(actions.set('thesauri.thesaurus', thesauri[0]));
    store!.dispatch(actions.set('templates', templates));
    store!.dispatch(
      actions.set('thesauri.suggestInfo', {
        property: templates[0].properties![0],
      } as ThesaurusSuggestions)
    );
    spyOn(api, 'get').and.callFake(() => ({
      json: {
        state: 'running',
        message: 'sync',
        result: {},
      },
    }));
    spyOn(ThesauriAPI, 'getModelTrainStatus').and.callFake(() => ({
      state: 'done',
      message: 'model',
      result: {},
    }));
    spyOn(ThesauriAPI, 'getModelStatus').and.callFake(() => ({
      preferred: '123',
      name: 'model',
      topics: {},
    }));
    spyOn(SearchAPI, 'search').and.callFake(() => rawSuggestionResult);
    spyOn(ThesauriAPI, 'save').and.callFake(({ data }) => data);
  });

  it('toggleEnableClassification', async () => {
    expect(store!.getState().thesauri.thesaurus.get('enable_classification')).toBe(false);
    await store!.dispatch(cockpitActions.toggleEnableClassification());
    expect(store!.getState().thesauri.thesaurus.get('enable_classification')).toBe(true);
    await store!.dispatch(cockpitActions.toggleEnableClassification());
    expect(store!.getState().thesauri.thesaurus.toJS()).toEqual(thesauri[0]);
  });

  it('updateCockpitData', async () => {
    await store!.dispatch(cockpitActions.updateCockpitData());
    expect(store!.getState().thesauri.suggestInfo.toJS()).toEqual({
      model: { preferred: '123', name: 'model', topics: {} },
      property: templates[0].properties![0],
      docsWithSuggestionsForPublish: {
        totalRows: 1,
        totalLabels: 2,
        thesaurus: { propertyName: 'opts', totalValues: { v1: 2, v2: 0 } },
      },
      docsWithSuggestionsForReview: {
        totalRows: 1,
        totalLabels: 2,
        thesaurus: { propertyName: 'opts', totalValues: { v1: 2, v2: 0 } },
      },
      docsWithLabels: {
        totalRows: 1,
        totalLabels: 0,
        thesaurus: { propertyName: 'opts', totalValues: {} },
      },
    } as ThesaurusSuggestions);
    expect(store!.getState().thesauri.tasksState.toJS()).toEqual({
      SyncState: { state: 'running', message: 'sync', result: {} },
      TrainState: { state: 'done', message: 'model', result: {} },
    } as TasksState);
  });
});
