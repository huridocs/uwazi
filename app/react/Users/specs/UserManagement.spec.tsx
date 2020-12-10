import React from 'react';
import { shallow } from 'enzyme';
import { UserManagement } from 'app/Users/UserManagement';
import { Tabs } from 'react-tabs-redux';

describe('UserGroupList', () => {
  function render() {
    return shallow(<UserManagement />);
  }
  it('should render users as default tab', () => {
    const component = render();
    const tabs = component.find(Tabs).at(0);
    expect(tabs.props().selectedTab).toBe('users');
  });
  it('should handle select updating the selected tab state', () => {
    const component = render();
    const tabs = component.find(Tabs).at(0);
    tabs.props().handleSelect?.('usergroups', '');
    const updatedTabs = component.find(Tabs).at(0);
    expect(updatedTabs.props().selectedTab).toBe('usergroups');
  });
});
