import { ShallowWrapper } from 'enzyme';
import { ShareEntityModal } from 'app/Permissions/components/ShareEntityModal';
import { PermissionSchema } from 'shared/types/permissionType';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { AccessLevels, PermissionType, MixedAccess } from 'shared/types/permissionSchema';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import { renderConnected } from 'app/Templates/specs/utils/renderConnected';
import * as api from 'app/Permissions/PermissionsAPI';
import { saveEntitiesPermissions } from 'app/Permissions/actions/actions';
import { UserGroupsLookupField } from '../UserGroupsLookupField';
import { MembersList } from '../MembersList';
import { data } from './testData';

jest.mock('app/Permissions/actions/actions', () => ({
  saveEntitiesPermissions: jest.fn().mockReturnValue(async () => Promise.resolve()),
}));

describe('ShareEntityModal', () => {
  let component: ShallowWrapper;
  const defaultProps = {
    sharedIds: ['entityId1', 'entityId2'],
    isOpen: true,
    onClose: jest.fn(),
  };

  function render(props: any) {
    component = renderConnected(ShareEntityModal, props, {});
  }

  beforeAll(() => {
    jest.spyOn(api, 'searchCollaborators').mockImplementation(async () => Promise.resolve(data));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    render(defaultProps);
  });

  it('should trigger a search when the search changes', () => {
    component.find(UserGroupsLookupField).simulate('change', 'searchTerm');
    expect(api.searchCollaborators).toHaveBeenCalledWith('searchTerm');
  });

  it('should add a member to the list when it is selected', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      level: AccessLevels.WRITE,
    };
    component.find(UserGroupsLookupField).simulate('select', testMember);
    expect(component.find(MembersList).get(0).props.members).toContainEqual(testMember);
  });

  it('should assign read permissions as default', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
    };
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
    };
    component.find(UserGroupsLookupField).simulate('select', testMember);
    component.find(MembersList).simulate('change', []);
    expect(
      component
        .find(MembersList)
        .get(0)
        .props.members.filter((m: MemberWithPermission) => !!m._id)
    ).toEqual([]);
  });

  it('should not save and show validation error if a member has mixed access permissions', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      level: MixedAccess.MIXED,
    };

    const testValidationError: {
      type: PermissionType;
      _id: ObjectIdSchema;
    } = {
      type: PermissionType.USER,
      _id: '1',
    };
    component.find(UserGroupsLookupField).simulate('select', testMember);
    component.find('.btn-success').simulate('click');
    expect(saveEntitiesPermissions).not.toHaveBeenCalled();
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
      level: AccessLevels.READ,
    };

    const sentPermissions: PermissionSchema[] = [
      {
        _id: '1',
        type: PermissionType.USER,
        level: AccessLevels.READ,
      },
    ];

    component.find(UserGroupsLookupField).simulate('select', testMember);
    await component
      .find('.btn-success')
      .get(0)
      .props.onClick();
    expect(saveEntitiesPermissions).toHaveBeenCalledWith({
      ids: ['entityId1', 'entityId2'],
      permissions: sentPermissions,
    });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should show one "done" button on pristine, and two on dirty', () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: PermissionType.USER,
      label: 'User',
      level: AccessLevels.WRITE,
    };
    expect(component.find('Footer').get(0).props.children.type).toBe('button');
    component.find(UserGroupsLookupField).simulate('select', testMember);
    expect(component.find('Footer').get(0).props.children.length).toBe(2);
  });

  it('should call onClose when clicking done', () => {
    component.find('button.pristine').simulate('click');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should close without saving when clicking discard', async () => {
    const testMember: MemberWithPermission = {
      _id: '1',
      type: 'user',
      label: 'User',
      level: AccessLevels.READ,
    };

    component.find(UserGroupsLookupField).simulate('select', testMember);
    await component
      .find('.cancel-button')
      .get(0)
      .props.onClick();
    expect(saveEntitiesPermissions).not.toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
