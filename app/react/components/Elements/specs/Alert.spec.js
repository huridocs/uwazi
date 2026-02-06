import React from 'react';
import { shallow } from 'enzyme';

import Alert from '../Alert.js';

describe('Alert', () => {
  let component;
  let instance;
  let props;

  const render = () => {
    component = shallow(<Alert {...props} />);
    instance = component.instance();
  };

  it('should display the message', () => {
    props = { message: 'Finaly, you are up!', type: 'success' };
    render();
    expect(component).toMatchSnapshot();

    props = { message: 'Warning!', type: 'warning' };
    render();
    expect(component).toMatchSnapshot();

    props = { message: 'Danger!', type: 'danger' };
    render();
    expect(component).toMatchSnapshot();
  });

  describe('show', () => {
    it('should not render if component hasnt a message', () => {
      props = { message: '' };
      render();
      expect(component).toMatchSnapshot();
    });
  });

  describe('hide()', () => {
    it('should hide the Alert', () => {
      props = { message: 'Finaly, you are up!', type: 'success' };
      render();

      instance.hide();
      component.update();
      expect(component).toMatchSnapshot();
    });
  });
});
