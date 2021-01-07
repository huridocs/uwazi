/**
 * @jest-environment jsdom
 */
import 'mutationobserver-shim';
import React from 'react';
import { ReactWrapper } from 'enzyme';
import { SidePanel } from 'app/Layout';
import { renderConnectedMount } from 'app/Templates/specs/utils/renderConnected';
import { UserSidePanel, UserSidePanelProps } from 'app/Users/components/UserSidePanel';
import { UserRole } from 'shared/types/userSchema';
import MultiSelect from 'app/Forms/components/MultiSelect';

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
  const group1 = { _id: 'group1', name: 'Denunciantes', members: [] };
  const group2 = { _id: 'group2', name: 'Asesores legales', members: [] };
  const defaultProps: UserSidePanelProps = {
    user: existingUser,
    users: [existingUser],
    groups: [group1, group2],
    opened: true,
    closePanel: jasmine.createSpy('closePanel'),
    onSave: jasmine.createSpy('onSave'),
    onDelete: jasmine.createSpy('onDelete'),
  };
  let component: ReactWrapper<React.Component['props'], React.Component['state'], React.Component>;

  function render(args?: UserSidePanelProps) {
    const props = { ...defaultProps, ...args };
    return renderConnectedMount(UserSidePanel, {}, props, true);
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
    it.each([
      { field: 'username', value: existingUser.username },
      { field: 'username', value: '' },
      { field: 'email', value: 'invalidEmail' },
      { field: 'email', value: existingUser.email },
      { field: 'email', value: '' },
    ])('should not save if there is an invalid value %s', ({ field, value }) => {
      const props = { ...defaultProps };
      props.user = { ...newUser, [field]: value };
      const wrapper = render(props);
      wrapper.find('form').simulate('submit');
      expect(defaultProps.onSave).not.toBeCalled();
    });

    it('should save the data of the passed user', () => {
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

  describe('Groups membership', () => {
    it('should list all the available groups sorted alphabetically', () => {
      const availableGroups = component.find(MultiSelect);
      expect(availableGroups.props().options).toEqual([group1, group2]);
    });
  });
});
