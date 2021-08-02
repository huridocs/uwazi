/**
 * @jest-environment jsdom
 */
import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';

import { getFixturesFactory } from 'api/utils/fixturesFactory';
import MetadataExtractionDashboard from '../MetadataExtractionDashboard';

const factory = getFixturesFactory();
const templates = Immutable.fromJS([
  factory.template('templateA', [
    factory.property('AonlyText', 'text'),
    factory.property('ABsharedDate', 'date'),
    factory.property('ACsharedMarkdown', 'markdown'),
    factory.property('ABCsharedNumber', 'numeric'),
    factory.property('sharedIgnoredLink', 'link'),
  ]),
  factory.template('templateB', [
    factory.property('BonlyText', 'text'),
    factory.property('ABsharedDate', 'date'),
    factory.property('BCsharedMarkdown', 'markdown'),
    factory.property('ABCsharedNumber', 'numeric'),
    factory.property('sharedIgnoredLink', 'link'),
  ]),
  factory.template('templateC', [
    factory.property('ConlyText', 'text'),
    factory.property('ACsharedMarkdown', 'markdown'),
    factory.property('BCsharedMarkdown', 'markdown'),
    factory.property('ABCsharedNumber', 'numeric'),
    factory.property('sharedIgnoredLink', 'link'),
  ]),
]);
const settings = {
  collection: Immutable.fromJS({
    features: {
      'metadata-extraction': [
        {
          id: factory.id('templateA'),
          properties: ['AonlyText', 'ABsharedDate', 'ACsharedMarkdown', 'ABCsharedNumber'],
        },
        {
          id: factory.id('templateB'),
          properties: ['BonlyText', 'ABsharedDate', 'BCsharedMarkdown', 'ABCsharedNumber'],
        },
        {
          id: factory.id('templateC'),
          properties: ['ConlyText', 'ACsharedMarkdown', 'BCsharedMarkdown', 'ABCsharedNumber'],
        },
      ],
    },
  }),
};
const expectedFormattedData = {
  formattedData: {
    AonlyText: {
      firstProperty: {
        name: 'AonlyText',
        type: 'text',
      },
      templates: [{ name: 'templateA' }],
    },
    ABsharedDate: {
      firstProperty: {
        name: 'ABsharedDate',
        type: 'date',
      },
      templates: [{ name: 'templateA' }, { name: 'templateB' }],
    },
    ACsharedMarkdown: {
      firstProperty: {
        name: 'ACsharedMarkdown',
        type: 'markdown',
      },
      templates: [{ name: 'templateA' }, { name: 'templateC' }],
    },
    ABCsharedNumber: {
      firstProperty: {
        name: 'ABCsharedNumber',
        type: 'numeric',
      },
      templates: [{ name: 'templateA' }, { name: 'templateB' }, { name: 'templateC' }],
    },
    BonlyText: {
      firstProperty: {
        name: 'BonlyText',
        type: 'text',
      },
      templates: [{ name: 'templateB' }],
    },
    BCsharedMarkdown: {
      firstProperty: {
        name: 'BCsharedMarkdown',
        type: 'markdown',
      },
      templates: [{ name: 'templateB' }, { name: 'templateC' }],
    },
    ConlyText: {
      firstProperty: {
        name: 'ConlyText',
        type: 'text',
      },
      templates: [{ name: 'templateC' }],
    },
  },
};

describe('MetadataExtractionDashboard', () => {
  let component;
  let store;

  beforeEach(() => {
    store = {
      dispatch: jasmine.createSpy('dispatch'),
      subscribe: jasmine.createSpy('subscribe'),
      getState: () => ({ templates, settings }),
    };
  });

  const render = () => {
    component = shallow(<MetadataExtractionDashboard store={store} />).dive();
  };

  describe('componentDidMount', () => {
    it('should transform settings into expected format.', () => {
      render();
      expect(component.state()).toMatchObject(expectedFormattedData);
    });
  });
});
