import { shallow } from 'enzyme';
import React from 'react';
import { AccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { NeedAuthorization } from 'app/Auth';
import { MembersList } from '../MembersList';
import { data, pseudoData } from './testData';
import { MemberListItemInfo } from '../MemberListItemInfo';
import { MemberListItemPermission } from '../MemberListItemPermission';

describe('MemberList', () => {
  it('should render with the correct data', () => {
    const component = shallow(<MembersList members={data} onChange={() => {}} />);

    expect(component.find('tr').length).toBe(data.length);
    data.forEach(member => {
      const row = component.find('tr');
      expect(row.contains(<MemberListItemInfo value={member} />));
      const dropdown = row.find(MemberListItemPermission).filter({ value: member });
      expect(dropdown.length).toBe(1);
      expect(dropdown.parent().is(NeedAuthorization)).toBe(member.type === PermissionType.PUBLIC);
    });
  });

  it('should render pseudoMembers with the correct data', () => {
    const component = shallow(<MembersList members={pseudoData} onChange={() => {}} />);

    expect(component.find('tr').length).toBe(pseudoData.length);
    pseudoData.forEach(member => {
      const row = component.find('tr');
      expect(row.contains(<MemberListItemInfo value={member} />));
      expect(
        row.find(MemberListItemPermission).filter({ value: member, disabled: true }).length
      ).toBe(1);
    });
  });

  it('should call onChange when a row is deleted', () => {
    const reducedSet = data.slice(0, 2);
    const onChangeMock = jest.fn();
    const component = shallow(<MembersList members={reducedSet} onChange={onChangeMock} />);
    const permissionsComp = component.find(MemberListItemPermission).last().dive();

    permissionsComp.find('select').simulate('change', { target: { value: 'delete' } });

    expect(onChangeMock).toHaveBeenCalledWith([reducedSet[0]]);
  });

  it('should call onChange when a row is updated', () => {
    const reducedSet = data.slice(0, 2);
    const onChangeMock = jest.fn();
    const component = shallow(<MembersList members={reducedSet} onChange={onChangeMock} />);
    const permissionsComp = component.find(MemberListItemPermission).last().dive();

    permissionsComp.find('select').simulate('change', { target: { value: AccessLevels.WRITE } });

    expect(onChangeMock).toHaveBeenCalledWith([
      reducedSet[0],
      {
        ...reducedSet[1],
        level: AccessLevels.WRITE,
      },
    ]);
  });
});
