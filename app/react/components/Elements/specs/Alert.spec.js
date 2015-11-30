import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import Alert from '../Alert.js'


describe('MyAccount', () => {

  let component, message, type;

  function instantiate_component(res){

  }

  beforeEach(() => {
    message = 'Some feedback for the user'
    type = 'info'
    component = TestUtils.renderIntoDocument(<Alert message={message} type={type}/>);
  });

  describe('render()', () => {
    it('should render the message', () => {
      expect(ReactDOM.findDOMNode(component).textContent).toMatch(message);
    });
  });
});
