import React from 'react';
import {shallow} from 'enzyme';

import Numeric from '../Numeric';

describe('Numeric', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      value: 23,
      onChange: jasmine.createSpy('onChange')
    };
  });

  let render = () => {
    component = shallow(<Numeric {...props}/>);
  };

  it('should render an input with the date passed', () => {
    render();
    let input = component.find('input');
    expect(input.props().value).toEqual(23);
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      let input = component.find('input');
      input.simulate('change', {target: {value: '89'}});
      expect(props.onChange).toHaveBeenCalledWith(89);

      input.simulate('change', {target: {value: '8.9'}});
      expect(props.onChange).toHaveBeenCalledWith(8.9);

      input.simulate('change', {target: {value: '8.'}});
      expect(props.onChange).toHaveBeenCalledWith(8);
    });
  });
});
