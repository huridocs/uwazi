/**
 * @jest-environment jsdom
 */
import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { mount } from 'enzyme';

import { Notification as NotificationConnected } from '#app/Notifications/components/Notification.js';
import * as types from '#app/Notifications/actions/actionTypes.js';

const mockStore = configureStore([]);

describe('Notification connected', () => {
  it('uses custom removeNotification when provided', () => {
    const store = mockStore({});
    const custom = jest.fn();
    const wrapper = mount(
      <Provider store={store}>
        <NotificationConnected id="cookiepolicy" message="m" removeNotification={custom} />
      </Provider>
    );
    wrapper.find('.alert-success').simulate('click');
    expect(custom).toHaveBeenCalledWith('cookiepolicy');
    expect(store.getActions()).toEqual([]);
    wrapper.unmount();
  });

  it('dispatches REMOVE_NOTIFICATION without custom handler', () => {
    const store = mockStore({});
    mount(
      <Provider store={store}>
        <NotificationConnected id="x" message="m" />
      </Provider>
    )
      .find('.alert-success')
      .simulate('click');
    expect(store.getActions()).toEqual([{ type: types.REMOVE_NOTIFICATION, id: 'x' }]);
  });
});
