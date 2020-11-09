import UserGroups from 'app/Users/components/usergroups/UserGroups';
import Immutable from 'immutable';
import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import { UserGroupList } from 'app/Users/components/usergroups/UserGroupList';
import { UserGroupSchema } from 'shared/types/userGroupType';

describe('UserGroups', () => {
  let component: any;
  const userGroups: UserGroupSchema[] = [
    {
      _id: 'group1',
      name: 'Group 1',
      members: [],
    },
  ];
  const storeState = {
    userGroups: Immutable.fromJS(userGroups),
  };

  function render() {
    component = renderConnected(UserGroups, {}, storeState);
  }

  it('Should render the user groups from state', () => {
    render();
    const listComponent = component.find(UserGroupList).get(0);
    expect(listComponent.props.userGroups).toEqual(userGroups);
  });
});
