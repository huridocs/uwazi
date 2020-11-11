import React from 'react';
import { shallow } from 'enzyme';
import { UserManagement } from 'app/Users/UserManagement';

describe('UserGroupList', () => {
  function render() {
    return shallow(<UserManagement />);
  }
  it('should render users as default tab', () => {
    const component = render();
    expect(component.props().selectedTab).toBe('users');
  });
  it('should handle select updating the selected tab state', () => {
    const component = render();
    component.props().handleSelect('usergroups');
    component.update();
    expect(component.props().selectedTab).toBe('usergroups');
  });
});
