import React from 'react';
import { shallow } from 'enzyme';

import { ResultsFiltersPanel } from '../ResultsFiltersPanel';

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
