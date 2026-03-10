import React from 'react';

import { shallow } from 'enzyme';

import ConfirmButton from '../ConfirmButton';

import ConfirmModal from '../ConfirmModal';

describe('ConfirmButton', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      action: jasmine.createSpy('action'),
      className: 'class',
    };
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
      render();
      component.find('button').simulate('click');
      component.update();
      expect(component).toMatchSnapshot();
    });

    describe('onAccept', () => {
      it('should execute action and close modal', () => {
        render();
        component.find('button').simulate('click');
        component.update();
        component.find(ConfirmModal).props().onAccept();
        component.update();

        expect(component).toMatchSnapshot();
        expect(props.action).toHaveBeenCalled();
      });
    });

    describe('onCancel', () => {
      it('should should close modal', () => {
        render();
        component.find('button').simulate('click');
        component.update();
        component.find(ConfirmModal).props().onCancel();
        component.update();

        expect(component).toMatchSnapshot();
      });
    });
  });
});
