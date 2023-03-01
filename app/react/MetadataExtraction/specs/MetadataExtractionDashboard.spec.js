import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import { I18NLink } from 'app/I18N';
import { getFixturesFactory } from 'api/utils/fixturesFactory';
import { MetadataExtractionDashboard } from 'app/MetadataExtraction/MetadataExtractionDashboard';

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
const ixExtractors = Immutable.fromJS([
  factory.ixExtractor('AtextExtractor', 'aonlytext', ['templateA']),
  factory.ixExtractor('ABdateExtractor', 'abshareddate', ['templateA', 'templateB']),
  factory.ixExtractor('ABCnumberExtractor', 'abc_shared_number', [
    'templateA',
    'templateB',
    'templateC',
  ]),
]);
const settings = {
  collection: Immutable.fromJS({
    features: {
      'metadata-extraction': true,
      metadataExtraction: {
        templates: [],
      },
    },
  }),
};

describe('MetadataExtractionDashboard', () => {
  let component;
  let store;

  beforeEach(() => {
    store = {
      dispatch: jasmine.createSpy('dispatch'),
      subscribe: jasmine.createSpy('subscribe'),
      getState: () => ({ templates, settings, ixExtractors }),
    };
  });

  const render = () => {
    component = shallow(<MetadataExtractionDashboard store={store} />).dive();
  };

  describe('review suggestions', () => {
    it('table should show extractor name, property, templates', () => {
      render();
      const rows = component.find('tbody').find('tr');
      expect(rows.length).toBe(3);
      const info = rows.map(r => r.find('td').map(td => td.text()));
      const names = info.map(i => i[1]);
      expect(names).toEqual([
        '<Connect(Icon) />AonlyText',
        '<Connect(Icon) />ABsharedDate',
        '<Connect(Icon) />ABC shared Number',
      ]);
      const properties = info.map(i => i[2]);
      expect(properties[0]).toMatch('templateA');
      expect(properties[1]).toMatch('templateAtemplateB');
      expect(properties[2]).toMatch('templateAtemplateBtemplateC');
      const templateLists = info.map(i => i[3]);
      expect(templateLists).toEqual([
        '<Connect(I18NLink) />',
        '<Connect(I18NLink) />',
        '<Connect(I18NLink) />',
      ]);
    });

    it('should show a link to the suggestions review panel for each property', () => {
      render();
      const links = component
        .find('td')
        .find(I18NLink)
        .map(l => l.props().to);
      expect(links.length).toBe(3);
      expect(links).toEqual([
        `settings/metadata_extraction/suggestions/${factory.id('AtextExtractor')}`,
        `settings/metadata_extraction/suggestions/${factory.id('ABdateExtractor')}`,
        `settings/metadata_extraction/suggestions/${factory.id('ABCnumberExtractor')}`,
      ]);
    });
  });
});
