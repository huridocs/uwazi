import React from 'react';
import { shallow } from 'enzyme';

import NumericRangeSlide from '../NumericRangeSlide';

describe('NumericRangeSlide', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      onChange: jasmine.createSpy('onChange'),
      value: 0.5,
      min: 0,
      max: 1,
      step: 0.1
    };
  });

  const render = () => {
    component = shallow(<NumericRangeSlide {...props}/>);
  };

  describe('when a date is selected', () => {
    it('should triger onChange events', () => {
      render();
      component.find('input').first().simulate('change', { target: { value: '0.6' } });
      expect(props.onChange).toHaveBeenCalledWith(0.6);
    });
  });
});
