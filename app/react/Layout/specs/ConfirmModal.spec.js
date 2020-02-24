import React from 'react';

import { shallow } from 'enzyme';

import ConfirmModal from '../ConfirmModal';

describe('ConfirmModal', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      onAccept: jasmine.createSpy('onAccept'),
      onCancel: jasmine.createSpy('onCancel'),
    };
  });

  const render = () => {
    component = shallow(<ConfirmModal {...props} />);
  };

  it('should render a confirm modal', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  describe('when clicking on cancel/accept buttond', () => {
    it('should call onCancel and onAccept', () => {
      render();
      component.find('.cancel-button').simulate('click');
      expect(props.onCancel).toHaveBeenCalled();

      component.find('.confirm-button').simulate('click');
      expect(props.onAccept).toHaveBeenCalled();
    });
  });
});
