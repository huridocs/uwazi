import React from 'react';
import { shallow } from 'enzyme';
import { DocumentResults } from '../DocumentResults';

describe('DocumentResults', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      doc: {
        semanticSearch: {
          results: [{ score: 0.5, text: 'one' }, { score: 0.2, text: 'two' }],
          relevantRate: 0.5,
          numRelevant: 1,
          totalResults: 2,
        },
        avgScore: 0.4
      },
      threshold: 0.3,
      changeTreshHold: jasmine.createSpy('changeTreshhold'),
      selectTab: jasmine.createSpy('selectTab'),
      selectSnippet: jasmine.createSpy('selectSnippet')
    };

    component = shallow(<DocumentResults {...props}/>);
  });

  describe('render', () => {
    it('should render result snippets above threshold', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
