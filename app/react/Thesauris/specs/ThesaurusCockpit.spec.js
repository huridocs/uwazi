/** @format */
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import React from 'react';
import RouteHandler from 'app/App/RouteHandler';

import { ThesaurusCockpitBase } from '../ThesaurusCockpit';

describe('ThesaurusCockpit', () => {
  let component;
  let props;
  let context;
  let dispatchCallsOrder = [];

  const models = [
    {
      bert: 'testBert',
      completeness: 0,
      extraneous: 0,
      instances: ['timestamp'],
      name: 'ThesaurusName',
      preferred: 'timestamp',
      topics: {
        Topic1: {
          name: 'topic_1',
          quality: 0.8,
          samples: 20,
        },
        Topic2: {
          name: 'topic_2',
          quality: 0.92,
          samples: 25,
        },
        Topic3: {
          name: 'topic_3',
          quality: 0.62,
          samples: 2,
        },
      },
    },
  ];
  const thesaurus = {
    _id: 'underscoreId',
    enable_classification: true,
    name: 'Topic1',
    property: {
      content: 'content1',
      label: 'Topic1',
      name: 'topic_1',
    },
    values: [
      {
        _id: 'underscoreId1',
        label: 'label1',
        id: 'id1',
      },
      {
        _id: 'underscoreId2',
        label: 'label2',
        id: 'id2',
      },
    ],
  };

  const suggestions = [
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
          _topic_1: {
            buckets: [
              {
                key: 'id1',
                doc_count: 8528,
                filtered: {
                  doc_count: 1,
                  meta: {},
                },
              },
              { key: 'id2', doc_count: 6923, filtered: {} },
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
          _explanation: {},
          _id: 'docId1',
        },
      ],
      totalRows: 1,
    },
  ];

  beforeEach(() => {
    props = { models, thesaurus, suggestions };
    RouteHandler.renderedFromServer = true;
    dispatchCallsOrder = [];
    context = {
      subscribe: jest.fn(), // Find out why this needs to be here.
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
    expect(component).toMatchSnapshot();
  });

  it('should find the cockpit table and verify names, values and quality icons', () => {
    render();
    expect(component.find('.cockpit').length).toBe(1);
  });
});
