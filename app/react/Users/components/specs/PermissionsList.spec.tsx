import React from 'react';
import { shallow } from 'enzyme';
import { PermissionsList } from 'app/Users/components/PermissionsList';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';

describe('PermissionsList', () => {
  it('should show a list of permissions by role', () => {
    const onCloseMock = jest.fn();
    const rolePermissions = [
      {
        label: 'permission description',
        roles: { admin: 'full', editor: 'partial', collaborator: 'none' },
      },
    ];
    const component = shallow(
      <PermissionsList isOpen onClose={onCloseMock} rolePermissions={rolePermissions} />
    );
    const rows = component.find('tbody > tr');
    const columns = rows.at(0).find('td');
    expect(columns.find(Translate).at(0).props().children).toContain('permission description');
    expect(columns.find(Icon).at(0).props().icon).toEqual('times');
    expect(columns.find(Icon).at(1).props().icon).toEqual('user-check');
    expect(columns.find(Icon).at(2).props().icon).toEqual('check');
  });
});
