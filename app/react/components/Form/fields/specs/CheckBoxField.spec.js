import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import CheckBoxField from '../CheckBoxField.js'

describe('CheckBoxField', () => {

  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<CheckBoxField/>);
  });

  describe('value()', () => {
    it('should return the checkbox value', () => {
      component.field.checked = true;
      expect(component.value()).toBe(true);

      component.field.checked = false;
      expect(component.value()).toBe(false);
    });
  });

  describe('on instance', () => {
    it('should set value passed as input value', () => {
      let value = true;
      component = TestUtils.renderIntoDocument(<CheckBoxField value={value}/>);
      expect(component.value()).toBe(true);
    });
  });

  describe('handleChange', () => {
    it('should set field value on state', () => {
      component.field.checked = true;
      component.handleChange();
      expect(component.state.value).toBe(true);
    });
  });

});
