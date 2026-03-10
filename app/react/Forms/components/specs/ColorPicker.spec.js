import React from 'react';
import { shallow } from 'enzyme';
import { TwitterPicker } from 'react-color';

import ColorPicker from '../ColorPicker';

describe('ColorPicker', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      defaultValue: '#112233',
      onChange: jest.fn(),
    };
  });

  const render = () => {
    component = shallow(<ColorPicker {...props} />);
  };

  const renderAndActivate = () => {
    render();
    component.setState({ active: true });
    component.update();
  };

  it('should render ColorPicker button with specified value as color', () => {
    props.value = '#ffffff';
    render();
    expect(component).toMatchSnapshot();
  });

  it('should show defaultValue color if value is not provided', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when button is clicked', () => {
    it('should display color picker if hidden', () => {
      render();
      component.find('.ColorPicker__button').first().simulate('click');
      component.update();
      expect(component).toMatchSnapshot();
    });
    it('should hide color picker if displayed', () => {
      renderAndActivate();
      component.find('.ColorPicker__button').first().simulate('click');
      expect(component).toMatchSnapshot();
    });
  });

  describe('when color picker is displayed', () => {
    it('should close when clicking outside', () => {
      renderAndActivate();
      component.find('.ColorPicker__cover').first().simulate('click');
      expect(component).toMatchSnapshot();
    });
  });

  it('should call onChange with when new color is selected', () => {
    renderAndActivate();
    component.find(TwitterPicker).prop('onChangeComplete')({ hex: '#001100' });
    expect(props.onChange).toHaveBeenCalledWith('#001100');
  });
});
