/* eslint-disable max-lines */
import RouteHandler from 'app/App/RouteHandler';
import api from 'app/Search/SearchAPI';
import TemplatesAPI from 'app/Templates/TemplatesAPI';
import ThesauriAPI from 'app/Thesauri/ThesauriAPI';
import { RequestParams } from 'app/utils/RequestParams';
import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { TemplateSchema } from 'shared/types/templateType';
import { ThesaurusSchema } from 'shared/types/thesaurusType';
import { SuggestInfo } from '../actions/thesaurusCockpitActions';
import { ThesaurusCockpitBase, ThesaurusCockpitProps } from '../ThesaurusCockpit';
import { ClassifierModelSchema } from '../types/classifierModelType';
import { LabelCountSchema } from '../types/labelCountType';

const templates: TemplateSchema[] = [
  {
    _id: 'underscoreID',
    name: 'Paragraph',
    properties: [
      {
        id: 'propertyID1',
        _id: '_propertyID1',
        name: 'thesaurus_name',
        label: 'ThesaurusName',
        content: 'thesaurusUnderscoreId1',
        type: 'multiselect',
      },
    ],
    default: true,
    commonProperties: [
      {
        label: 'commonProp1',
        type: 'multiselect',
      },
    ],
  },
  {
    _id: 'underscoreID2',
    name: 'Recommendation',
    properties: [
      {
        id: 'propertyID2',
        _id: '_propertyID2',
        name: 'recommendation',
        label: 'Recommendation',
        content: 'thesaurusUnderscoreId2',
        type: 'multiselect',
      },
    ],
    default: false,
    commonProperties: [
      {
        label: 'commonProp2',
        type: 'multiselect',
      },
    ],
  },
];
const model: ClassifierModelSchema = {
  config: { bert: 'testBert' },
  completeness: 0,
  extraneous: 0,
  instances: ['timestamp'],
  name: 'ThesaurusName',
  preferred: 'timestamp',
  topics: {
    'Topic 1': {
      name: 'Topic 1',
      quality: 0.8,
      samples: 20,
    },
    'Topic 2': {
      name: 'Topic 2',
      quality: 0.92,
      samples: 25,
    },
    'Topic 3': {
      name: 'Topic 3',
      quality: 0.62,
      samples: 2,
    },
  },
};
const thesauri: ThesaurusSchema[] = [
  {
    _id: 'thesaurusUnderscoreId1',
    name: 'ThesaurusName',
    values: [
      { _id: 'underscoreId1', label: 'Topic 1', id: 'id1' },
      { _id: 'underscoreId2', label: 'Topic 2', id: 'id2' },
      { _id: 'underscoreId3', label: 'Topic 3', id: 'id3' },
    ],
    enable_classification: true,
  },
  {
    _id: 'thesaurusUnderscoreId2',
    name: 'ThesaurusWithoutSuggestions',
    values: [{ _id: 'underscoreId1', label: 'Topic 1', id: 'id1' }],
    enable_classification: false,
  },
];
const rawSuggestionResult: any = {
  totalRows: 1,
  aggregations: {
    all: {
      _thesaurus_name: {
        buckets: [
          {
            key: 'id1',
            filtered: {
              doc_count: 2,
            },
          },
          {
            key: 'id2',
            filtered: {
              doc_count: 0,
            },
          },
        ],
      },
    },
  },
};
const flattenedSuggestions: LabelCountSchema = {
  totalRows: 2,
  totalLabels: 4,
  thesaurus: {
    propertyName: 'thesaurus_name',
    totalValues: {
      id1: 4,
      id2: 0,
    },
  },
};

describe('ThesaurusCockpit', () => {
  describe('render', () => {
    let component: ShallowWrapper<ThesaurusCockpitProps, {}, ThesaurusCockpitBase>;
    let props: ThesaurusCockpitProps;
    let context: any;
    let dispatchCallsOrder: any[];

    beforeEach(() => {
      const thesaurus = thesauri[0];
      thesaurus.property = {
        id: 'ID1',
        _id: '_ID1',
        content: 'content1',
        label: 'ThesaurusName',
        name: 'thesaurus_name',
      };
      props = {
        suggestInfo: {
          model,
          docsWithLabels: flattenedSuggestions,
          docsWithSuggestionsForPublish: flattenedSuggestions,
          docsWithSuggestionsForReview: flattenedSuggestions,
        },
        thesaurus: thesauri[0],
        taskState: {},
        updateTaskState: jasmine.createSpy('updateTaskState'),
        startTraining: jasmine.createSpy('startTraining'),
        toggleEnableClassification: jasmine.createSpy('toggleEnableClassification'),
      };
      RouteHandler.renderedFromServer = true;
      dispatchCallsOrder = [];
      context = {
        confirm: jasmine.createSpy('confirm'),
        store: {
          getState: () => ({}),
          dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
            dispatchCallsOrder.push(action.type);
          }),
        },
      };
    });

    const render = () => {
      component = shallow(<ThesaurusCockpitBase {...props} />, { context });
    };

    it('should render a ThesaurusCockpit', () => {
      render();
    });

    it('should find the cockpit table and verify names and counts', () => {
      render();
      expect(component.find('.cockpit').length).toBe(1);
      expect(component.find({ scope: 'row' }).length).toBe(3);
      /* We expect 2 data cells -- suggestion counts and a review button */
      expect(component.find('td').children().length).toBe(2);
      expect(component.find({ title: 'publish-button' }).length).toBe(1);
      expect(component.find({ title: 'review-button-title' }).length).toBe(1);
      expect(component.find({ title: 'suggestions-count' }).someWhere(n => n.text() === '4')).toBe(
        true
      );
    });

    it('should not render the Review Documents buttons when there are < 1 suggestions to be reviewed', () => {
      props.suggestInfo.docsWithSuggestionsForReview = {
        totalRows: 0,
        totalLabels: 0,
        thesaurus: {
          propertyName: 'thesaurus_name',
          totalValues: {
            id1: 0,
            id2: 0,
          },
        },
      };
      component = shallow(<ThesaurusCockpitBase {...props} />, { context });
      expect(component.find({ scope: 'row' }).length).toBe(3);
      // We don't expect a 'to be reviewed' count, nor a 'suggestions button'
      expect(component.find('td').children().length).toBe(0);
    });

    it('should not render the publish button when there are < 1 suggestions', () => {
      props.suggestInfo.docsWithSuggestionsForPublish = {
        totalRows: 0,
        totalLabels: 0,
        thesaurus: {
          propertyName: 'thesaurus_name',
          totalValues: {
            id1: 1,
            id2: 0,
          },
        },
      };
      component = shallow(<ThesaurusCockpitBase {...props} />, { context });
      expect(component.find({ title: 'publish-button' }).length).toBe(0);
      expect(component.find('td').children().length).toBe(2);
    });
  });

  describe('requestState', () => {
    beforeEach(() => {
      spyOn(ThesauriAPI, 'getThesauri').and.returnValue(Promise.resolve(thesauri));
      spyOn(ThesauriAPI, 'getModelStatus').and.returnValue(Promise.resolve([model]));
      spyOn(TemplatesAPI, 'get').and.returnValue(Promise.resolve(templates));
      spyOn(api, 'search').and.returnValue(Promise.resolve(rawSuggestionResult));
    });

    it('should get the thesaurus, classification model and suggestion counts as react actions', async () => {
      const actions = await ThesaurusCockpitBase.requestState(new RequestParams());
      expect(ThesauriAPI.getThesauri).toHaveBeenCalled();
      expect(TemplatesAPI.get).toHaveBeenCalled();
      expect(ThesauriAPI.getModelStatus).toHaveBeenCalled();
      expect(api.search).toHaveBeenCalledTimes(4);

      expect(actions.length).toBe(4);
      actions.forEach(action => {
        switch (action.type) {
          case 'thesauri.thesaurus/SET':
            expect(action.value).toEqual(thesauri[0]);
            break;
          case 'thesauri.suggestInfo/SET':
            expect(action.value).toEqual({
              model,
              docsWithLabels: flattenedSuggestions,
              docsWithSuggestionsForPublish: flattenedSuggestions,
              docsWithSuggestionsForReview: flattenedSuggestions,
            } as SuggestInfo);
            break;
          default:
        }
      });
    });
  });
});
