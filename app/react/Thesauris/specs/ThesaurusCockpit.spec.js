/** @format */
import { shallow } from 'enzyme';
import React from 'react';
import RouteHandler from 'app/App/RouteHandler';

import { I18NLink } from 'app/I18N/components/I18NLink';
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
    },
  ];
  const thesaurus = {
    _id: 'underscoreId',
    enable_classification: true,
    name: 'ThesaurusName',
    property: {
      content: 'content1',
      label: 'ThesaurusName',
      name: 'thesaurus_name',
    },
    values: [
      {
        _id: 'underscoreId1',
        label: 'Topic 1',
        id: 'id1',
      },
      {
        _id: 'underscoreId2',
        label: 'Topic 2',
        id: 'id2',
      },
      {
        _id: 'underscoreId3',
        label: 'Topic 3',
        id: 'id3',
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
          thesaurus_name: {
            buckets: [],
          },
          _thesaurus_name: {
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
    expect(component.find({ scope: 'row' }).length).toBe(3);
    /* We expect 5 data cells -- three with quality icons and 1 each of
    suggestion counts and a review button */
    expect(component.find('td').children().length).toBe(5);
    expect(component.find({ title: 'review-button-title' }).length).toBe(1);
    expect(component.contains(<td title="suggestions-count">{1}</td>)).toEqual(true);
  });
});
