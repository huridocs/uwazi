import React from 'react';
import { shallow } from 'enzyme';
import { DocumentResults } from '../DocumentResults';

describe('DocumentResults', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      doc: { semanticSearch: { results: [{ score: 9 }, { score: 11 }] }, avgScore: 10 },
      filters: { threshold: 10 },
      threshold: 0.3,
      changeTreshhold: jasmine.createSpy('changeTreshhold'),
      selectTab: jasmine.createSpy('selectTab'),
      selectSnippet: jasmine.createSpy('selectSnippet')
    };

    component = shallow(<DocumentResults {...props}/>);
  });

  describe('render', () => {
    it('should render a result', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
