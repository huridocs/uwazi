import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import TextareaField from '../TextareaField.js'

describe('TextareaField', () => {

  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<TextareaField value='text'/>);
  });

  describe('on instance', () => {
    it('should set value passed as input value', () => {
      expect(component.value()).toBe('text');
    });
  });

  describe('handleChange', () => {
    it('should set field value on state', () => {
      component.field.value = 'Gordon';
      component.handleChange();
      expect(component.state.value).toBe('Gordon');
    });
  });

  describe('value()', () => {
    it('should return the textarea value', () => {
      component.field.value = 'Bane';
      expect(component.value()).toBe('Bane');

      component.field.value = 'Deadshot';
      expect(component.value()).toBe('Deadshot');
    });
  });

  describe('componentDidUpdate()', () => {
    it('should set state.value with new props.value', () => {
      //render the component again using reactDom forces the component to update itself
      ReactDOM.render(<TextareaField value='deadshot'/>, ReactDOM.findDOMNode(component).parentNode);
      expect(component.state.value).toBe('deadshot');
    })
  });

});
