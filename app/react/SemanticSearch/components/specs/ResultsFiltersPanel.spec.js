import React from 'react';
import { ResultsFiltersPanel } from '../ResultsFiltersPanel';
import { shallow } from 'enzyme';

describe('ResultsFiltersPanel', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      open: true,
      filters: { threshold: 10 },
      selectTab: jasmine.createSpy('selectTab'),
      selectSnippet: jasmine.createSpy('selectSnippet')
    };

    component = shallow(<ResultsFiltersPanel {...props}/>);
  });

  describe('render', () => {
    it('should render a result', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
