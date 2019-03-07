import React from 'react';

import { shallow } from 'enzyme';
import { ResultsSidePanel } from '../ResultsSidePanel';

describe('DocumentResults', () => {
  let component;
  beforeEach(() => {
    component = shallow(<ResultsSidePanel />);
  });

  describe('render', () => {
    it('should render a result', () => {
      expect(component).toMatchSnapshot();
    });
  });
});
