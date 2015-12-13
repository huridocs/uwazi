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

});
