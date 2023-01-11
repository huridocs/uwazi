/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { UserManagement } from 'app/Users/UserManagement';
import * as Users from 'app/Users/components/Users';
import * as UserGroups from 'app/Users/components/usergroups/UserGroups';

import { renderConnectedContainer, defaultState } from 'app/utils/test/renderConnected';

const FakeTabContent = () => <span>Users</span>;
describe('UserGroupList', () => {
  beforeEach(() => {
    spyOn(Users, 'Users').and.returnValue(<FakeTabContent />);
    spyOn(UserGroups, 'UserGroups').and.returnValue(<FakeTabContent />);
  });
  function render() {
    return renderConnectedContainer(<UserManagement />, () => defaultState);
  }
  it('should render users as default tab', () => {
    render();
    const tabs = screen.getAllByRole('tab');
    expect(tabs[0].className).toContain('react-tabs__tab--selected');
    expect(tabs[1].className).not.toContain('react-tabs__tab--selected');
  });
  it('should handle select updating the selected tab state', async () => {
    render();
    const tabs = screen.getAllByRole('tab');
    await act(() => {
      fireEvent.click(tabs[1]);
    });
    expect(tabs[0].className).not.toContain('react-tabs__tab--selected');
    expect(tabs[1].className).toContain('react-tabs__tab--selected');
  });
});
