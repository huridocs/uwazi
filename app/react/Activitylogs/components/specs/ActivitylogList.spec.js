import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import ActivitylogList from '../ActivitylogList.js';

describe('ActivitylogList', () => {
  let props;
  let component;

  const render = () => {
    props = {
      activitylog: Immutable.fromJS([
        { _id: 1, method: 'POST', url: '/api/entities', body: '{"title":"hey"}', query: '{}', time: 12345 },
        { _id: 2, method: 'GET', url: '/api/entities', body: '{}', query: '{"_id": "123"}', time: 12345 },
        { _id: 3, method: 'DELETE', url: '/api/entities', body: '{"_id":"123"}', query: '{}', time: 12345 },
      ])
    };
    component = shallow(<ActivitylogList.WrappedComponent {...props}/>);
  };

  it('should render a table with the activity log entries', () => {
    render();
    expect(component).toMatchSnapshot();
  });
});
