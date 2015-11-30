import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import Alert from '../Alert.js'


describe('MyAccount', () => {

  let component;
  let message = 'Some feedback for the user';
  let type = 'info';

  describe('render()', () => {

    it('should render the message', () => {
      component = TestUtils.renderIntoDocument(<Alert message={message} type={type}/>);
      expect(ReactDOM.findDOMNode(component).textContent).toMatch(message);
    });

    describe('when there is no message', function(){
      it('should render an empty div', () => {
        message = undefined;
        component = TestUtils.renderIntoDocument(<Alert message={message} type={type}/>);
        expect(ReactDOM.findDOMNode(component).innerHTML).toMatch('');
      });
    });
  });
});
