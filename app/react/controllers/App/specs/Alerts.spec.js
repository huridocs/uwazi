import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import Alerts from '../Alerts.js'
import {events} from '../../../utils/index'

describe('Alerts', () => {

  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<Alerts />);
  })

  it('should listen to alert events and add them to state', () => {
    events.emit('alert', 'success', 'Yay! an alert has been created!');
    expect(component.state.alerts[0]).toEqual({type: 'success', message: 'Yay! an alert has been created!'})
  });

});
