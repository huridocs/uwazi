import React from 'react';
import { ResultsFiltersPanel } from '../ResultsFiltersPanel';
import { shallow } from 'enzyme';

describe('ResultsFiltersPanel', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      open: true,
      filtersValues: { threshold: 10 }
    };

    component = shallow(<ResultsFiltersPanel {...props}/>);
  });

  describe('render', () => {
    it('should render a result', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
