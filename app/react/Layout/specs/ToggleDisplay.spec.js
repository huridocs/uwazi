import React from 'react';

import { shallow } from 'enzyme';

import ToggleDisplay from '../ToggleDisplay';

describe('ToggleDisplay', () => {
  it('should not render children by default', () => {
    const component = shallow(
      <ToggleDisplay>
        <span>children</span>
      </ToggleDisplay>
    );
    expect(component).toMatchSnapshot();
  });

  it('should render labels passed for buttons', () => {
    const component = shallow(
      <ToggleDisplay showLabel="showLabel" hideLabel="hideLabel">
        <span>children</span>
      </ToggleDisplay>
    );
    expect(component.find('button')).toMatchSnapshot();
    component.setState({ show: true });
    expect(component.find('button')).toMatchSnapshot();
  });

  describe('when passed open true', () => {
    it('should show the children by default', () => {
      const component = shallow(
        <ToggleDisplay open>
          <span>children</span>
        </ToggleDisplay>
      );
      expect(component).toMatchSnapshot();
    });
  });

  describe('on show button click', () => {
    it('should render children passed and hide button', () => {
      const component = shallow(
        <ToggleDisplay>
          <span>children</span>
        </ToggleDisplay>
      );
      component.find('button').simulate('click');
      expect(component).toMatchSnapshot();
    });
  });

  describe('on hide button click', () => {
    it('should render hide children', () => {
      const component = shallow(
        <ToggleDisplay>
          <span>children</span>
        </ToggleDisplay>
      );
      component.find('button').simulate('click');
      component.find('button').simulate('click');
      expect(component).toMatchSnapshot();
    });

    it('should call onHide callback prop', () => {
      const onHide = jasmine.createSpy('onHide');
      const component = shallow(
        <ToggleDisplay onHide={onHide}>
          <span>children</span>
        </ToggleDisplay>
      );
      component.find('button').simulate('click');
      component.find('button').simulate('click');
      expect(onHide).toHaveBeenCalled();
    });
  });
});
