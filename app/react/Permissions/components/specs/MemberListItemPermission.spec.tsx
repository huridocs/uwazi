import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { data } from './testData';
import { MemberListItemPermission } from '../MemberListItemPermission';

describe('MemberListItem', () => {
  describe('for each test element', () => {
    const assert = (component: ShallowWrapper, testMember: MemberWithPermission) => {
      if (testMember.type === PermissionType.GROUP) {
        expect(component.find('select').length).toBe(1);
      }

      if (testMember.type === PermissionType.USER) {
        expect(component.find('select').length).toBe(1);

        const selectOptionForMixed = component.find('option').filter({ value: AccessLevels.MIXED })
          .length;
        if (testMember.level === AccessLevels.MIXED) {
          expect(selectOptionForMixed).toBe(1);
        } else {
          expect(selectOptionForMixed).toBe(0);
        }
      }
    };

    it.each([...data.keys()])('should render the correct role and access dropdown', member => {
      const testMember = data[member];
      const onChangeMock = jest.fn();
      const onDeleteMock = jest.fn();

      const component = shallow(
        <MemberListItemPermission
          value={testMember}
          onChange={onChangeMock}
          onDelete={onDeleteMock}
        />
      );

      assert(component, testMember);
    });
  });

  it('should call onChange with the changed member', () => {
    const onChangeMock = jest.fn();
    const onDeleteMock = jest.fn();

    const component = shallow(
      <MemberListItemPermission value={data[1]} onChange={onChangeMock} onDelete={onDeleteMock} />
    );

    component
      .find('select')
      .get(0)
      .props.onChange({ target: { value: AccessLevels.WRITE } });

    expect(onChangeMock).toHaveBeenCalledWith({
      ...data[1],
      level: AccessLevels.WRITE,
    });
    expect(onDeleteMock).not.toHaveBeenCalled();
  });

  it('should call onDelete with the deleted member', () => {
    const onChangeMock = jest.fn();
    const onDeleteMock = jest.fn();

    const component = shallow(
      <MemberListItemPermission value={data[1]} onChange={onChangeMock} onDelete={onDeleteMock} />
    );

    component
      .find('select')
      .get(0)
      .props.onChange({ target: { value: 'delete' } });

    expect(onDeleteMock).toHaveBeenCalledWith(data[1]);
    expect(onChangeMock).not.toHaveBeenCalled();
  });

  it('should render a disabled select if disabled', () => {
    const component = shallow(
      <MemberListItemPermission value={data[1]} onChange={() => {}} onDelete={() => {}} disabled />
    );

    expect(component.find('select').get(0).props.disabled).toBe(true);
  });
});
