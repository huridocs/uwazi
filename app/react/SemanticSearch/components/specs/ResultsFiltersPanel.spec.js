import React from 'react';
import { shallow } from 'enzyme';

import { ResultsFiltersPanel } from '../ResultsFiltersPanel';

describe('ResultsFiltersPanel', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      open: true,
      filtersValues: { threshold: 0.8 },
    };

    component = shallow(<ResultsFiltersPanel {...props} />);
  });

  describe('render', () => {
    it('should render search filters and instructions', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
