import { shallow } from 'enzyme';
import React from 'react';
import { MemberListItemInfo } from '../MemberListItemInfo';
import { data } from './testData';

describe('MemberListItem', () => {
  const expectedIcon = ['user', 'users', 'users', 'user', 'user', 'globe-africa'];

  it.each([...data.keys()])('should render the correct name and icon', member => {
    const component = shallow(<MemberListItemInfo value={data[member]} />);

    expect(component.find({ icon: expectedIcon[member] }).length).toBe(1);
    expect(component.find({ children: data[member].label }).length).toBe(1);
  });
});
