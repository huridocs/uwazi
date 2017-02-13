import React from 'react';
import {shallow} from 'enzyme';

import NumericRange from '../NumericRange';
import Numeric from '../Numeric';

describe('NumericRange', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      model: 'model',
      onChange: jasmine.createSpy('onChange'),
      value: {from: 2, to: 4}
    };
  });

  let render = () => {
    component = shallow(<NumericRange {...props}/>);
  };

  describe('when a date is selected', () => {
    it('should triger onChange events', () => {
      render();
      component.find(Numeric).first().simulate('change', 0.23);
      expect(props.onChange).toHaveBeenCalledWith({from: 0.23, to: 4});
      component.find(Numeric).last().simulate('change', 86);
      expect(props.onChange).toHaveBeenCalledWith({from: 0.23, to: 86});
    });
  });
});
