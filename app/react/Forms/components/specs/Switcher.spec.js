import React from 'react';
import { shallow } from 'enzyme';

import Switcher from '../Switcher';

describe('Switcher', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      value: true,
      onChange: jasmine.createSpy('onChange'),
      prefix: 'my',
    };
  });

  const render = () => {
    component = shallow(<Switcher {...props} />);
  };

  it('should render an input with the value and prefix passed', () => {
    render();
    const input = component.find('input');
    expect(input.props().checked).toBe(true);
    expect(input.props().id).toBe('myswitcher');
    const label = component.find('label');
    expect(label.props().htmlFor).toBe('myswitcher');
  });

  describe('onChange', () => {
    it('should return the value in timestamp', () => {
      render();
      const input = component.find('input');
      input.simulate('change', { target: { checked: false } });
      expect(props.onChange).toHaveBeenCalledWith(false);
    });
  });
});
