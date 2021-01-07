/**
 * @jest-environment jsdom
 */
import 'mutationobserver-shim';
import React from 'react';
import Immutable from 'immutable';
import { ReactWrapper } from 'enzyme';
import { SidePanel } from 'app/Layout';
import { renderConnectedMount } from 'app/Templates/specs/utils/renderConnected';
import { UserSidePanel, UserSidePanelProps } from 'app/Users/components/UserSidePanel';
import { UserRole } from 'shared/types/userSchema';

describe('UserSidePanel', () => {
  const newUser = {
    username: 'john smith',
    email: 'john@test.test',
    role: UserRole.EDITOR,
    password: 'secretWord',
  };
  const existingUser = {
    _id: 'user1',
    username: 'juan ramirez',
    email: 'juanr@test.test',
    role: UserRole.EDITOR,
    password: 'secretWord',
  };

  const defaultProps: UserSidePanelProps = {
    user: existingUser,
    users: [existingUser],
    opened: true,
    closePanel: jasmine.createSpy('closePanel'),
    onSave: jasmine.createSpy('onSave'),
    onDelete: jasmine.createSpy('onDelete'),
  };
  let component: ReactWrapper<React.Component['props'], React.Component['state'], React.Component>;

  function render(args?: UserSidePanelProps) {
    const props = { ...defaultProps, ...args };
    const state = {
      locale: 'es',
      inlineEdit: Immutable.fromJS({ inlineEdit: true }),
      translations: Immutable.fromJS([{ _id: 1, locale: 'es', contexts: [] }]),
    };
    return renderConnectedMount(UserSidePanel, state, props);
  }

  beforeEach(() => {
    component = render();
  });

  describe('Side panel opening', () => {
    it('should set SidePanel as open if opened prop is true', () => {
      const sidePanel = component.find(SidePanel);
      expect(sidePanel.props().open).toBe(true);
    });

    it('should call the closePanel method on Discard Changes button click', () => {
      component.find({ id: 'discardChangesBtn' }).simulate('click');
      expect(defaultProps.closePanel).toHaveBeenCalled();
    });
  });

  describe('Edition of user', () => {
    it.each([existingUser.username, ''])(
      'should not save if there is an invalid name %s',
      (username: string) => {
        const props = { ...defaultProps };
        props.user = { ...newUser, username };
        const wrapper = render(props);
        wrapper.find('form').simulate('submit');
        expect(defaultProps.onSave).not.toBeCalled();
      }
    );

    it.each(['invalidEmail', existingUser.email, ''])(
      'should not save if there is an invalid email %s',
      (email: string) => {
        const props = { ...defaultProps };
        props.user = { ...newUser, email };
        const wrapper = render(props);
        wrapper.find('form').simulate('submit');
        expect(defaultProps.onSave).not.toBeCalled();
      }
    );

    it('should should the data of the passed user', () => {
      const emailInput = component.find({ id: 'email_field' }).find('input');
      expect(emailInput.props().value).toEqual(defaultProps.user.email);
      const roleInput = component.find({ id: 'role_field' }).find('select');
      expect(roleInput.props().value).toEqual(defaultProps.user.role);
      const nameInput = component.find({ id: 'name_field' }).find('input');
      expect(nameInput.props().value).toEqual(defaultProps.user.username);
      const passwordInput = component.find({ id: 'password_field' }).find('input');
      expect(passwordInput.props().value).toEqual(defaultProps.user.password);
    });
  });
});
