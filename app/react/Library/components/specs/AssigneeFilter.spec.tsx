import { shallow, ShallowWrapper } from 'enzyme';
import React from 'react';
import { AssigneeFilterSelectUncontrolled } from '../AssigneeFilter';

describe('AssigneeFilter uncontrolled', () => {
  const aggregations = {
    all: {
      '_permissions.read': {
        buckets: [
          { key: 'user1', label: 'User 1', filtered: { doc_count: 1 } },
          { key: 'user2', label: 'User 2', filtered: { doc_count: 2 } },
          { key: 'group1', label: 'Group 1', icon: 'users', filtered: { doc_count: 3 } },
        ],
      },
      '_permissions.write': {
        buckets: [
          { key: 'user1', label: 'User 1', filtered: { doc_count: 4 } },
          { key: 'user2', label: 'User 2', filtered: { doc_count: 5 } },
          { key: 'group1', label: 'Group 1', icon: 'users', filtered: { doc_count: 6 } },
        ],
      },
    },
  };

  const selected: {
    level: 'read' | 'write';
    refId: string;
  }[] = [
    { level: 'read', refId: 'user1' },
    { level: 'read', refId: 'user2' },
    { level: 'write', refId: 'group1' },
  ];

  const onChangeMock = jest.fn();

  let component: ShallowWrapper;

  beforeEach(() => {
    component = shallow(
      <AssigneeFilterSelectUncontrolled
        onChange={onChangeMock}
        aggregations={aggregations}
        value={selected}
      />
    );
  });

  it('should split the selection and options between read and write multiselects', () => {
    const multiselects = component.find('MultiSelect');

    const read = multiselects.get(0);
    const write = multiselects.get(1);

    expect(read.props.value).toEqual(['user1', 'user2']);
    expect(write.props.value).toEqual(['group1']);

    expect(read.props.options).toMatchObject([
      {
        label: 'User 1',
        title: 'User 1',
        results: 1,
        value: 'user1',
      },
      {
        label: 'User 2',
        title: 'User 2',
        results: 2,
        value: 'user2',
      },
      {
        label: 'Group 1',
        title: 'Group 1',
        results: 3,
        value: 'group1',
        icon: { type: 'Icons', _id: 'users' },
      },
    ]);
    expect(write.props.options).toEqual([
      {
        label: 'User 1',
        title: 'User 1',
        results: 4,
        value: 'user1',
      },
      {
        label: 'User 2',
        title: 'User 2',
        results: 5,
        value: 'user2',
      },
      {
        label: 'Group 1',
        title: 'Group 1',
        results: 6,
        value: 'group1',
        icon: { type: 'Icons', _id: 'users' },
      },
    ]);
  });

  it('should all onChange with the joined results', () => {
    const onChangeRead = component.find('MultiSelect').get(0).props.onChange;

    onChangeRead(['user1', 'user2', 'group1']);

    expect(onChangeMock).toHaveBeenCalledWith([
      {
        refId: 'group1',
        level: 'write',
      },
      {
        refId: 'user1',
        level: 'read',
      },
      {
        refId: 'user2',
        level: 'read',
      },
      {
        refId: 'group1',
        level: 'read',
      },
    ]);
  });
});
