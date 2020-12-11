import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { data } from './testData';
import { MemberListItemPermission } from '../MemberListItemPermission';
import { MemberWithPermission } from '../../EntityPermisions';

describe('MemberListItem', () => {
  describe('for each test element', () => {
    const assert = (component: ShallowWrapper, testMember: MemberWithPermission) => {
      if (testMember.type === 'group') {
        expect(component.find('select').length).toBe(1);
      }

      if (testMember.type === 'user') {
        expect(
          component
            .find('span')
            .get(0)
            .props.children.props.children.toLowerCase()
        ).toBe(testMember.role);

        expect(component.find('select').length).toBe(1);

        const selectOptionForMixed = component.find('option').filter({ value: 'mixed' }).length;
        if (testMember.level === 'mixed') {
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
      .props.onChange({ target: { value: 'write' } });

    expect(onChangeMock).toHaveBeenCalledWith({
      ...data[1],
      level: 'write',
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
});
