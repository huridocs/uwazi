/**
 * @jest-environment jsdom
 */
import 'mutationobserver-shim';
import React from 'react';
import { ReactWrapper } from 'enzyme';
import { SidePanel } from 'app/Layout';
import { renderConnectedMount } from 'app/utils/test/renderConnected';
import { UserSidePanel, UserSidePanelProps } from 'app/Users/components/UserSidePanel';
import { UserRole } from 'shared/types/userSchema';
import { PermissionsList } from 'app/Users/components/PermissionsList';
import { MultiSelect } from 'app/Forms/components/MultiSelect';

describe('UserSidePanel', () => {
  const newUser = {
    username: 'john smith',
    email: 'john@test.test',
    role: UserRole.EDITOR,
    password: 'secretWord',
  };
  const group1 = { _id: 'group1', name: 'Denunciantes', members: [] };
  const group2 = { _id: 'group2', name: 'Asesores legales', members: [] };
  const existingUser = {
    _id: 'user1',
    username: 'juan ramirez',
    email: 'juanr@test.test',
    role: UserRole.EDITOR,
    password: 'secretWord',
    groups: [group1],
  };
  let defaultProps: UserSidePanelProps;
  let component: ReactWrapper<React.Component['props'], React.Component['state'], React.Component>;

  function render(args?: UserSidePanelProps) {
    const props = { ...defaultProps, ...args };
    return renderConnectedMount(UserSidePanel, {}, props, true);
  }

  beforeEach(() => {
    defaultProps = {
      user: existingUser,
      users: [existingUser],
      groups: [group1, group2],
      opened: true,
      closePanel: jasmine.createSpy('closePanel'),
      onSave: jasmine.createSpy('onSave'),
      onDelete: jasmine.createSpy('onDelete'),
      onReset2fa: jasmine.createSpy('onReset2fa'),
      onResetPassword: jasmine.createSpy('onResetPassword'),
    };
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

    it('should render the data of the passed user', () => {
      const emailInput = component.find({ id: 'email_field' }).find('input');
      expect((emailInput.getDOMNode() as HTMLInputElement).value).toEqual(defaultProps.user.email);
      const roleInput = component.find({ id: 'role_field' }).find('select');
      expect((roleInput.getDOMNode() as HTMLInputElement).value).toEqual(defaultProps.user.role);
      const nameInput = component.find({ id: 'username_field' }).find('input');
      expect((nameInput.getDOMNode() as HTMLInputElement).value).toEqual(
        defaultProps.user.username
      );
      const passwordInput = component.find({ id: 'password_field' }).find('input');
      expect((passwordInput.getDOMNode() as HTMLInputElement).value).toEqual(
        defaultProps.user.password
      );
    });
  });

  describe('Edition of user', () => {
    it.each<any>([
      { field: 'username', value: existingUser.username, message: 'Duplicated username' },
      { field: 'username', value: '', message: 'Username is required' },
      { field: 'username', value: 'a'.repeat(55), message: 'Username is too long' },
      { field: 'username', value: 'a', message: 'Username is too short' },
      { field: 'email', value: existingUser.email, message: 'Duplicated email' },
      { field: 'email', value: '', message: 'Email is required' },
    ])(
      'should not save if there is an invalid value %s',
      ({ field, value, message }, done: jest.DoneCallback) => {
        const props = { ...defaultProps };
        props.user = { ...newUser, [field]: value };
        const wrapper = render(props);
        wrapper.find('form').simulate('submit');

        setTimeout(() => {
          wrapper.update();
          const error = wrapper
            .find({ id: `${field}_field` })
            .children()
            .find('div')
            .at(0);
          expect(defaultProps.onSave).not.toBeCalled();
          expect(error.text()).toEqual(message);
          done();
        }, 0);
      }
    );

    it('should save the changes over the user', done => {
      const emailInput = component.find({ id: 'email_field' }).find('input').at(0);
      // @ts-ignore
      emailInput.instance().value = 'newemail@test.test';
      emailInput.simulate('change');
      component.find('form').simulate('submit');
      const savedUser = {
        _id: 'user1',
        email: 'newemail@test.test',
        groups: [
          {
            _id: 'group1',
            name: 'Denunciantes',
          },
        ],
        password: 'secretWord',
        role: 'editor',
        username: 'juan ramirez',
        using2fa: '',
      };
      setTimeout(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith(savedUser);
        done();
      }, 0);
    });
  });

  describe('Reset 2FA', () => {
    it('should not show reset 2FA action button if user is not using 2fa', () => {
      expect(component.find('#reset2faBtn').length).toBe(0);
    });
    describe('User using 2fa', () => {
      it('should call the onReset2fa function when confirm reset 2fa', () => {
        const props = { ...defaultProps };
        props.user.using2fa = true;
        component = render(props);
        component.find('#reset2faBtn').simulate('click');
        component.find('.confirm-button').simulate('click');
        expect(defaultProps.onReset2fa).toHaveBeenCalled();
      });
    });
  });

  describe('Reset Password', () => {
    it('should call the resetPasswordHandler function when confirm reset password', () => {
      component.find('#resetPasswordBtn').simulate('click');
      component.find('.confirm-button').simulate('click');
      expect(defaultProps.onResetPassword).toHaveBeenCalled();
    });
  });

  describe('Groups membership', () => {
    it('should list all the available groups sorted alphabetically', () => {
      const availableGroups = component.find(MultiSelect);
      expect(availableGroups.props().options).toEqual([group1, group2]);
    });

    describe('adding a group', () => {
      beforeEach(() => {
        const groupsToCheck = component.find(MultiSelect).find('input').at(1);
        groupsToCheck.simulate('change');
      });

      it('should add the checked group of MultiSelect to the list of selectedGroups', () => {
        const selectedGroups = component.find(MultiSelect).props().value;
        expect(selectedGroups).toEqual(['group1', 'group2']);
      });

      it('should save the user with the groups she belongs to', done => {
        component.find('form').simulate('submit');
        setTimeout(() => {
          expect(defaultProps.onSave).toHaveBeenCalledWith({
            _id: 'user1',
            email: 'juanr@test.test',
            password: 'secretWord',
            role: 'editor',
            username: 'juan ramirez',
            using2fa: 'true',
            groups: [
              { _id: 'group1', name: 'Denunciantes' },
              { _id: 'group2', name: 'Asesores legales' },
            ],
          });
          done();
        }, 0);
      });
    });
  });

  describe('Role permissions info modal', () => {
    it('should not show the permission modal by default', () => {
      const permissionModal = component.find(PermissionsList);
      expect(permissionModal.props().isOpen).toBe(false);
    });
    it('should open modal when role info button is clicked', () => {
      const roleInfoButton = component.find('#role-info').at(0);
      roleInfoButton.simulate('click');
      const permissionModal = component.find(PermissionsList);
      expect(permissionModal.props().isOpen).toBe(true);
    });
  });

  describe('Deleting user', () => {
    it('should call the onDelete prop', () => {
      component.find({ id: 'deleteBtn' }).simulate('click');
      component.find('.confirm-button').simulate('click');
      expect(defaultProps.onDelete).toHaveBeenCalledWith(defaultProps.user);
    });
  });
});
