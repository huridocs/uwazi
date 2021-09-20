import React from 'react';
import { shallow } from 'enzyme';
import { Aggregations } from 'shared/types/aggregations';
import { fromJS } from 'immutable';
import { MultiSelect } from 'app/Forms';
import { renderConnected } from 'app/utils/test/renderConnected';
import { PermissionsFilter, PermissionsFilterUncontrolled } from '../PermissionsFilter';

describe('Permissions Filter', () => {
  let component: any;
  let onChangeMock: any;

  const aggregations = {
    all: {
      '_permissions.self': {
        buckets: [
          { key: 'read', filtered: { doc_count: 3 } },
          { key: 'write', filtered: { doc_count: 6 } },
        ],
      },
    },
  };

  const render = (
    aggs: Aggregations = aggregations,
    value: { level: string; refId: string }[] = []
  ) => {
    onChangeMock = jest.fn();
    const props = {
      value,
      onChange: onChangeMock,
      aggregations: aggs,
    };

    const state = {
      user: fromJS({
        _id: 'userId',
        groups: [{ _id: 'groupId' }],
      }),
    };

    component = renderConnected(PermissionsFilterUncontrolled, props, state);
  };

  it('should display the number of entities the user has permissions on', () => {
    render();
    const options = component.find(MultiSelect).prop('options');
    expect(options).toEqual([
      expect.objectContaining({ value: 'write', results: 6 }),
      expect.objectContaining({ value: 'read', results: 3 }),
    ]);
  });

  it('should map from level to ownIds-level pairs', () => {
    render();
    const onChange = component.find(MultiSelect).prop('onChange');
    onChange(['read', 'write']);
    expect(onChangeMock).toHaveBeenCalledWith([
      { level: 'read', refId: 'userId' },
      { level: 'read', refId: 'groupId' },
      { level: 'write', refId: 'userId' },
      { level: 'write', refId: 'groupId' },
    ]);
  });

  it('should map from ownIds-level pairs to level', () => {
    render(aggregations, []);
    expect(component.find(MultiSelect).prop('value')).toEqual([]);

    render(aggregations, [{ level: 'read', refId: 'userId' }]);
    expect(component.find(MultiSelect).prop('value')).toEqual([]);

    render(aggregations, [
      { level: 'read', refId: 'userId' },
      { level: 'read', refId: 'groupId' },
    ]);
    expect(component.find(MultiSelect).prop('value')).toEqual(['read']);

    render(aggregations, [
      { level: 'read', refId: 'userId' },
      { level: 'read', refId: 'groupId' },
      { level: 'write', refId: 'userId' },
      { level: 'write', refId: 'groupId' },
    ]);
    expect(component.find(MultiSelect).prop('value')).toEqual(['read', 'write']);
  });

  describe('when the sum of all aggregations is 0', () => {
    it('should not render anything ', async () => {
      const aggs = {
        all: {
          '_permissions.self': {
            buckets: [
              { key: 'read', filtered: { doc_count: 0 } },
              { key: 'write', filtered: { doc_count: 0 } },
            ],
          },
        },
      };

      component = shallow(<PermissionsFilter onChange={() => {}} aggregations={aggs} />);

      expect(component.children().length).toBe(0);
    });
  });
});
