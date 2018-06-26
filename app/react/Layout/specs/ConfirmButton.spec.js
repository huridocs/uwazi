import React from 'react';

import { shallow } from 'enzyme';

import ConfirmButton from '../ConfirmButton';

describe('ConfirmButton', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {};
  });

  const render = () => {
    component = shallow(<ConfirmButton {...props}>text</ConfirmButton>);
  };

  it('should render a button', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('on click', () => {
    it('should render a Confirm modal', () => {
      component.find('button').simulate('click');
      component.update();
      expect(component).toMatchSnapshot();
    });
  });
});
