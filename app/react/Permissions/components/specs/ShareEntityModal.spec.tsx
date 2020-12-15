import React from 'react';
import { shallow } from 'enzyme';
import { ShareEntityModal } from 'app/Permissions/components/ShareEntityModal';
import * as api from 'app/Permissions/PermissionsAPI';
import { PermissionSchema } from 'shared/types/permissionType';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { AccessLevels, PermissionType, UserRole } from 'shared/types/permissionSchema';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { UserGroupsLookupField } from '../UserGroupsLookupField';
import { data } from './testData';
import { MembersList } from '../MembersList';

describe('ShareEntityModal', () => {
  beforeAll(() => {
    jest.spyOn(api, 'searchCollaborators').mockImplementation(async () => Promise.resolve(data));
    jest.spyOn(api, 'savePermissions').mockImplementation(async () => Promise.resolve(null));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger a search when the search changes', () => {
    const component = shallow(<ShareEntityModal sharedIds={[]} isOpen onClose={() => {}} />);
    component.find(UserGroupsLookupField).simulate('change', 'searchTerm');
    expect(api.searchCollaborators).toHaveBeenCalledWith('searchTerm');
  });

  it('should add a member to the list when it is selected', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      role: UserRole.COLLABORATOR,
      level: AccessLevels.WRITE,
    };
    const component = shallow(<ShareEntityModal sharedIds={[]} isOpen onClose={() => {}} />);
    component.find(UserGroupsLookupField).simulate('select', testMember);
    expect(component.find(MembersList).get(0).props.members).toContainEqual(testMember);
  });

  it('should assign read permissions as default', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      role: UserRole.COLLABORATOR,
    };
    const component = shallow(<ShareEntityModal sharedIds={[]} isOpen onClose={() => {}} />);
    component.find(UserGroupsLookupField).simulate('select', testMember);
    expect(component.find(MembersList).get(0).props.members).toContainEqual({
      ...testMember,
      level: AccessLevels.READ,
    });
  });

  it('should update the assignments when deleting an item from the list', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: 'user',
      label: 'User',
      role: 'contributor',
    };
    const component = shallow(<ShareEntityModal sharedIds={[]} isOpen onClose={() => {}} />);
    component.find(UserGroupsLookupField).simulate('select', testMember);
    component.find(MembersList).simulate('change', []);
    expect(component.find(MembersList).get(0).props.members).toEqual([]);
  });

  it('should not save and show validation error if a member has mixed access permissions', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      role: UserRole.COLLABORATOR,
      level: AccessLevels.MIXED,
    };

    const testValidationError: {
      type: PermissionType;
      _id: ObjectIdSchema;
    } = {
      type: PermissionType.USER,
      _id: '1',
    };
    const component = shallow(<ShareEntityModal sharedIds={[]} isOpen onClose={() => {}} />);
    component.find(UserGroupsLookupField).simulate('select', testMember);
    component.find('.btn-success').simulate('click');
    expect(api.savePermissions).not.toHaveBeenCalled();
    expect(component.find(MembersList).get(0).props.validationErrors).toEqual([
      testValidationError,
    ]);
    expect(component.find('.validation-message').length).toBe(1);
  });

  it('should save the permissions', async () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      role: UserRole.COLLABORATOR,
      level: AccessLevels.READ,
    };

    const sentPermissions: PermissionSchema[] = [
      {
        _id: '1',
        type: PermissionType.USER,
        level: AccessLevels.READ,
      },
    ];

    const onCloseMock = jest.fn();

    const component = shallow(
      <ShareEntityModal sharedIds={['entityId1', 'entityId2']} isOpen onClose={onCloseMock} />
    );
    component.find(UserGroupsLookupField).simulate('select', testMember);
    await component
      .find('.btn-success')
      .get(0)
      .props.onClick();
    expect(api.savePermissions).toHaveBeenCalledWith(['entityId1', 'entityId2'], sentPermissions);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should show one "done" button on pristine, and two on dirty', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      role: UserRole.COLLABORATOR,
      level: AccessLevels.WRITE,
    };
    const component = shallow(<ShareEntityModal sharedIds={[]} isOpen onClose={() => {}} />);
    expect(component.find('Footer').get(0).props.children.type).toBe('button');
    component.find(UserGroupsLookupField).simulate('select', testMember);
    expect(component.find('Footer').get(0).props.children.length).toBe(2);
  });

  it('should call onClose when clicking done', () => {
    const onCloseMock = jest.fn();
    const component = shallow(<ShareEntityModal sharedIds={[]} isOpen onClose={onCloseMock} />);
    component.find('button.pristine').simulate('click');
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should close without saving when clicking discard', async () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: 'user',
      label: 'User',
      role: 'contributor',
      level: 'read',
    };

    const onCloseMock = jest.fn();

    const component = shallow(
      <ShareEntityModal sharedIds={['entityId1']} isOpen onClose={onCloseMock} />
    );
    component.find(UserGroupsLookupField).simulate('select', testMember);
    await component
      .find('.cancel-button')
      .get(0)
      .props.onClick();
    expect(api.savePermissions).not.toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });
});
