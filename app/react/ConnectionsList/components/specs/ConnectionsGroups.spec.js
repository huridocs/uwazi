import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {ConnectionsGroups} from '../ConnectionsGroups';
import ConnectionsGroup from '../ConnectionsGroup';

describe('ConnectionsGroups', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      connectionsGroups: Immutable([
        {key: 'g1', templates: [{_id: 't1', count: 1}]},
        {key: 'g2', templates: [{_id: 't2', count: 2}, {_id: 't3', count: 3}]}
      ])
    };
  });

  let render = () => {
    component = shallow(<ConnectionsGroups {...props} />);
  };

  it('should render each individual ConnectionsGroup', () => {
    render();

    const ref1 = component.find(ConnectionsGroup).at(0);
    const ref2 = component.find(ConnectionsGroup).at(1);

    expect(ref1.props().group).toBe(props.connectionsGroups.get(0));
    expect(ref2.props().group).toBe(props.connectionsGroups.get(1));
  });
});
