import React from 'react';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import { DocumentResults } from '../DocumentResults';

describe('DocumentResults', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      doc: {
        semanticSearch: {
          results: [
            { score: 0.6, text: 'bio two', page: 'bio' },
            { score: 0.5, text: 'page one', page: '1' },
            { score: 0.2, text: 'page two', page: '2' },
            { score: 0.1, text: 'bio one', page: 'bio' },
          ],
          relevantRate: 0.5,
          numRelevant: 2,
          totalResults: 4,
        },
        avgScore: 0.4,
      },
      threshold: 0.3,
      changeTreshHold: jasmine.createSpy('changeTreshhold'),
      selectTab: jasmine.createSpy('selectTab'),
      selectSnippet: jasmine.createSpy('selectSnippet'),
      template: Immutable.fromJS({
        commonProperties: [],
        properties: [{ name: 'bio', label: 'Biography' }],
      }),
    };

    component = shallow(<DocumentResults {...props} />);
  });

  describe('render', () => {
    it('should render results summary and snippets above threshold in SnippetsList', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
