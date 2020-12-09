import { shallow } from 'enzyme';
import React from 'react';
import { MemebersList } from '../MembersList';
import { data } from './testData';
import { MemberListItem } from '../MemberListItem';
import { MemberListItemPermission } from '../MemberListItemPermission';

describe('MemberList', () => {
  it('should render with the correct data', () => {
    const component = shallow(
      <MemebersList members={data} onChange={() => {}} validationErrors={[]} />
    );

    expect(component.find('tr').length).toBe(data.length);
    data.forEach(member => {
      const row = component.find('tr');
      expect(row.contains(<MemberListItem value={member} />));
      expect(row.find(MemberListItemPermission).filter({ value: member }).length).toBe(1);
    });
  });

  it('should call onChange when a row is deleted', () => {
    const reducedSet = data.slice(0, 2);
    const onChangeMock = jest.fn();
    const component = shallow(
      <MemebersList members={reducedSet} onChange={onChangeMock} validationErrors={[]} />
    );
    const permissionsComp = component
      .find(MemberListItemPermission)
      .last()
      .dive();

    permissionsComp.find('select').simulate('change', { target: { value: 'delete' } });

    expect(onChangeMock).toHaveBeenCalledWith([reducedSet[0]]);
  });

  it('should call onChange when a row is updated', () => {
    const reducedSet = data.slice(0, 2);
    const onChangeMock = jest.fn();
    const component = shallow(
      <MemebersList members={reducedSet} onChange={onChangeMock} validationErrors={[]} />
    );
    const permissionsComp = component
      .find(MemberListItemPermission)
      .last()
      .dive();

    permissionsComp.find('select').simulate('change', { target: { value: 'write' } });

    expect(onChangeMock).toHaveBeenCalledWith([
      reducedSet[0],
      {
        ...reducedSet[1],
        level: 'write',
      },
    ]);
  });
});
