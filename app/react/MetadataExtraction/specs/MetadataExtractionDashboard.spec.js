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
    factory.property('AonlyText', 'text', { name: 'aonlytext' }),
    factory.property('ABsharedDate', 'date', { name: 'abshareddate' }),
    factory.property('ACsharedMarkdown', 'markdown', { name: 'acsharedmarkdown' }),
    factory.property('ABC shared Number', 'numeric', { name: 'abc_shared_number' }),
    factory.property('sharedIgnoredLink', 'link', { name: 'sharedignoredlink' }),
  ]),
  factory.template('templateB', [
    factory.property('BonlyText', 'text', { name: 'bonlytext' }),
    factory.property('ABsharedDate', 'date', { name: 'abshareddate' }),
    factory.property('BCsharedMarkdown', 'markdown', { name: 'bcsharedmarkdown' }),
    factory.property('ABC shared number', 'numeric', { name: 'abc_shared_number' }),
    factory.property('sharedIgnoredLink', 'link', { name: 'sharedignoredlink' }),
  ]),
  factory.template('templateC', [
    factory.property('ConlyText', 'text', { name: 'conlytext' }),
    factory.property('ACsharedMarkdown', 'markdown', { name: 'acsharedmarkdown' }),
    factory.property('BCsharedMarkdown', 'markdown', { name: 'bcsharedmarkdown' }),
    factory.property('abc shared number', 'numeric', { name: 'abc_shared_number' }),
    factory.property('sharedIgnoredLink', 'link', { name: 'sharedignoredlink' }),
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
      properties: [{ label: 'AonlyText', name: 'aonlytext', type: 'text' }],
      templates: [{ name: 'templateA' }],
    },
    abshareddate: {
      properties: [
        { label: 'ABsharedDate', name: 'abshareddate', type: 'date' },
        { label: 'ABsharedDate', name: 'abshareddate', type: 'date' },
      ],
      templates: [{ name: 'templateA' }, { name: 'templateB' }],
    },
    acsharedmarkdown: {
      properties: [
        { label: 'ACsharedMarkdown', name: 'acsharedmarkdown', type: 'markdown' },
        { label: 'ACsharedMarkdown', name: 'acsharedmarkdown', type: 'markdown' },
      ],
      templates: [{ name: 'templateA' }, { name: 'templateC' }],
    },
    abc_shared_number: {
      properties: [
        { label: 'ABC shared Number', name: 'abc_shared_number', type: 'numeric' },
        { label: 'ABC shared number', name: 'abc_shared_number', type: 'numeric' },
        { label: 'abc shared number', name: 'abc_shared_number', type: 'numeric' },
      ],
      templates: [{ name: 'templateA' }, { name: 'templateB' }, { name: 'templateC' }],
    },
    bonlytext: {
      properties: [{ label: 'BonlyText', name: 'bonlytext', type: 'text' }],
      templates: [{ name: 'templateB' }],
    },
    bcsharedmarkdown: {
      properties: [
        { label: 'BCsharedMarkdown', name: 'bcsharedmarkdown', type: 'markdown' },
        { label: 'BCsharedMarkdown', name: 'bcsharedmarkdown', type: 'markdown' },
      ],
      templates: [{ name: 'templateB' }, { name: 'templateC' }],
    },
    conlytext: {
      properties: [{ label: 'ConlyText', name: 'conlytext', type: 'text' }],
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
    it('should fetch template and properties into expected format.', () => {
      render();
      expect(component.state()).toMatchObject(expectedFormattedData);
    });
  });
});
