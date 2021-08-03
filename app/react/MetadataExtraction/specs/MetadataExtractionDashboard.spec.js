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
    factory.property('ABC shared Number', 'numeric'),
    factory.property('sharedIgnoredLink', 'link'),
  ]),
  factory.template('templateB', [
    factory.property('BonlyText', 'text'),
    factory.property('ABsharedDate', 'date'),
    factory.property('BCsharedMarkdown', 'markdown'),
    factory.property('ABC shared number', 'numeric'),
    factory.property('sharedIgnoredLink', 'link'),
  ]),
  factory.template('templateC', [
    factory.property('ConlyText', 'text'),
    factory.property('ACsharedMarkdown', 'markdown'),
    factory.property('BCsharedMarkdown', 'markdown'),
    factory.property('abc shared number', 'numeric'),
    factory.property('sharedIgnoredLink', 'link'),
  ]),
]);
const settings = {
  collection: Immutable.fromJS({
    features: {
      'metadata-extraction': [
        {
          id: factory.id('templateA'),
          properties: ['AonlyText', 'ABsharedDate', 'ACsharedMarkdown', 'ABC shared Number'],
        },
        {
          id: factory.id('templateB'),
          properties: ['BonlyText', 'ABsharedDate', 'BCsharedMarkdown', 'ABC shared number'],
        },
        {
          id: factory.id('templateC'),
          properties: ['ConlyText', 'ACsharedMarkdown', 'BCsharedMarkdown', 'abc shared number'],
        },
      ],
    },
  }),
};
const expectedFormattedData = {
  formattedData: {
    aonlytext: {
      firstProperty: {
        name: 'aonlytext',
        type: 'text',
      },
      templates: [{ name: 'templateA' }],
    },
    abshareddate: {
      firstProperty: {
        name: 'abshareddate',
        type: 'date',
      },
      templates: [{ name: 'templateA' }, { name: 'templateB' }],
    },
    acsharedmarkdown: {
      firstProperty: {
        name: 'acsharedmarkdown',
        type: 'markdown',
      },
      templates: [{ name: 'templateA' }, { name: 'templateC' }],
    },
    abc_shared_number: {
      firstProperty: {
        name: 'abc_shared_number',
        type: 'numeric',
      },
      templates: [{ name: 'templateA' }, { name: 'templateB' }, { name: 'templateC' }],
    },
    bonlytext: {
      firstProperty: {
        name: 'bonlytext',
        type: 'text',
      },
      templates: [{ name: 'templateB' }],
    },
    bcsharedmarkdown: {
      firstProperty: {
        name: 'bcsharedmarkdown',
        type: 'markdown',
      },
      templates: [{ name: 'templateB' }, { name: 'templateC' }],
    },
    conlytext: {
      firstProperty: {
        name: 'conlytext',
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
