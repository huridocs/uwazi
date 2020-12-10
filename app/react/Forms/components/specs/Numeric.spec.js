import React from 'react';
import { shallow } from 'enzyme';

import Numeric from '../Numeric';

describe('Numeric', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      onChange: jasmine.createSpy('onChange'),
    };
  });

  const render = value => {
    component = shallow(<Numeric value={value} {...props} />);
  };

  it('should render an input with the number passed', () => {
    render(23);
    const input = component.find('input');
    expect(input.props().value).toEqual(23);
  });

  it('should render an empty input', () => {
    render();
    const input = component.find('input');
    expect(input.props().value).toEqual('');
  });

  it('should render an input with the number 0', () => {
    render(0);
    const input = component.find('input');
    expect(input.props().value).toEqual(0);
  });

  describe('onChange', () => {
    it('should be called with the correct number', () => {
      render(23);
      const input = component.find('input');
      input.simulate('change', { target: { value: '89' } });
      expect(props.onChange).toHaveBeenCalledWith(89);

      input.simulate('change', { target: { value: '8.9' } });
      expect(props.onChange).toHaveBeenCalledWith(8.9);

      input.simulate('change', { target: { value: '8.' } });
      expect(props.onChange).toHaveBeenCalledWith(8);

      input.simulate('change', { target: { value: '0' } });
      expect(props.onChange).toHaveBeenCalledWith(0);
    });

    it('should be called with the empty number', () => {
      render(23);
      const input = component.find('input');
      input.simulate('change', { target: { value: '' } });
      expect(props.onChange).toHaveBeenCalledWith('');
    });
  });
});
