import React from 'react';
import { shallow } from 'enzyme';
import Immutable from 'immutable';
import ActivitylogList, { mapStateToProps } from '../ActivitylogList.js';

describe('ActivitylogList', () => {
  let props;
  let state;
  let component;

  const render = () => {
    const semantic = {
      beautified: true,
      description: 'created',
      name: 'Name',
      action: 'CREATE',
      extra: 'extra info',
    };
    props = {};
    state = {
      activitylog: {
        list: Immutable.fromJS([
          {
            _id: 1,
            method: 'POST',
            url: '/api/entities',
            body: '{"title":"hey"}',
            query: '{}',
            time: '2019-06-17T13:36:12.697Z',
            semantic,
          },
          {
            _id: 2,
            method: 'GET',
            url: '/api/entities',
            body: '{}',
            query: '{"_id": "123"}',
            time: '2019-06-17T13:36:12.697Z',
            semantic: {},
          },
          {
            _id: 3,
            method: 'DELETE',
            url: '/api/entities',
            body: '{"_id":"123"}',
            query: '{}',
            time: '2019-06-17T13:36:12.697Z',
            semantic: {},
          },
        ]),
      },
    };

    const fullProps = Object.assign({}, props, mapStateToProps(state));
    component = shallow(<ActivitylogList.WrappedComponent {...fullProps} />);
  };

  it('should render a table with the activity log entries and more button', () => {
    render();
    expect(component).toMatchSnapshot();
  });

  it('should load more entries for the current search', () => {});
});
