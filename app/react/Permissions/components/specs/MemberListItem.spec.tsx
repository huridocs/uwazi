import { shallow } from 'enzyme';
import React from 'react';
import { MemberListItem } from '../MemberListItem';
import { data } from './testData';

describe('MemberListItem', () => {
  const expectedIcon = ['user', 'users', 'users', 'user', 'user'];

  it.each([...data.keys()])('should render the correct name and icon', member => {
    const component = shallow(<MemberListItem value={data[member]} />);

    expect(component.find({ icon: expectedIcon[member] }).length).toBe(1);
    expect(component.find({ children: data[member].label }).length).toBe(1);
  });
});
