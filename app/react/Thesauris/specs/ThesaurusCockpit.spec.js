/** @format */

import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import createStore from 'app/store';
import { I18NLink } from 'app/I18N';
import RouteHandler from 'app/App/RouteHandler';

import { STATES } from 'mongoose';
import ThesaurusCockpit from '../ThesaurusCockpit';

describe('ThesaurusCockpit', () => {
  let component;
  let instance;
  let props;
  let context;
  let dispatchCallsOrder = [];

  const models = Immutable.fromJS({
    bert: 'https://tfhub.dev/google/bert_uncased_L-12_H-768_A-12/1',
    completeness: 0,
    extraneous: 0,
    instances: ['1575275219'],
    name: 'Issues',
    preferred: '1575275219',
    topics: {
      'International humanitarian law': {
        name: 'International humanitarian law',
        quality: 0.8,
        samples: 20,
      },
      'UPR process': {
        name: 'UPR process',
        quality: 0.92,
        samples: 25,
      },
    },
  });
  const thesaurus = Immutable.fromJS({
    _id: '5d8cdf1f61cde0408222d66f',
    enable_classification: true,
    name: 'Issues',
    property: {
      content: '5d8cdf1f61cde0408222d66f',
      label: 'Issues',
      name: 'issues',
    },
    values: [
      {
        _id: '5d8cdf1f61cde0408222d89d',
        label: 'Asylum-seekers - refugees',
        id: '47822743-19d9-4f56-9849-a8d2b0d157d1',
      },
      {
        _id: '5d8cdf1f61cde0408222d89c',
        label: 'Business and human rights',
        id: '71c51d11-f596-40fc-803e-0f01589115ad',
      },
      {
        _id: '5d8cdf1f61cde0408222d89b',
        label: 'Civil society',
        id: '0675581a-356a-48d2-902c-59101bb0f2fb',
      },
    ],
  });

  const suggestions = Immutable.fromJS([
    {
      aggregations: { all: {} },
      rows: [],
      totalRows: 0,
    },
    {
      aggregations: {
        all: {
          doc_count: 65460,
          issues: {
            buckets: [],
          },
          _issues: {
            buckets: [
              {
                key: '09218063-ce05-4655-9904-3e38e2e624da',
                doc_count: 8528,
                filtered: {
                  doc_count: 1,
                  meta: {},
                },
              },
              { key: '91b8ad54-a283-4a38-83b0-cc4dfbab3503', doc_count: 6923, filtered: {} },
              {
                key: '48d0d1f7-15d9-42e4-9f36-fe9dff6458bb',
                doc_count: 5234,
                filtered: {
                  doc_count: 1,
                  meta: {},
                },
              },
            ],
          },
        },
      },
      rows: [
        {
          sharedId: 'jo9dvda1ux',
          snippets: '',
          count: 0,
          fullText: [],
          metadata: [],
          _explanation: {
            description:
              'ConstantScore(#ConstantScore(template:5d8ce04361cde0408222e9a8) ' +
              '#language:en #((-ConstantScore(DocValuesFieldExistsQuery [field=metadata.issues.value.raw]) #*:*) ' +
              'MatchNoDocsQuery("No terms supplied for "terms" query.")) ' +
              '#ConstantScore(DocValuesFieldExistsQuery [field=suggestedMetadata.issues.value.raw]))',
            details: [],
            value: 1,
          },
          _id: '5d8d42f261cde0408229a5ee',
        },
      ],
      totalRows: 1,
    },
  ]);

  const state = { thesauri: { models, thesaurus, suggestions } };

  beforeEach(() => {
    RouteHandler.renderedFromServer = true;
    props = { models, thesaurus, suggestions };
    dispatchCallsOrder = [];
    context = {
      store: {
        getState: () => state,
        subscribe: jest.fn(), // Find out why this needs to be here.
        confirm: jasmine.createSpy('confirm'),
        dispatch: jasmine.createSpy('dispatch').and.callFake(action => {
          dispatchCallsOrder.push(action.type);
        }),
      },
    };
  });

  const render = () => {
    component = shallow(<ThesaurusCockpit {...props} />, { context });
    instance = component.instance();
  };

  describe('render', () => {
    it('should a table of thesaurus values with their classification status and suggestions', () => {
      render();
      //const renderedContexts = component.find('cockpit').find(I18NLink);
      //expect(renderedContexts.at(0).props().children).toBe('Avengers');
      //expect(renderedContexts.at(2).props().children).toBe('Batman');
      //expect(renderedContexts.at(4).props().children).toBe('X-Men');
    });
  });
});
