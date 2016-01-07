import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import Form from '../Form.js'

describe('Form', () => {

  let component;

  let fields = [{
    type:'input',
    label:'Input'
  },
  {
    type:'checkbox',
    label:'Input 2'
  }];

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<Form fields={fields}/>);
  });

  describe('on instance', () => {
    it('should render the form based on the fields', () => {
      let inputs = TestUtils.scryRenderedDOMComponentsWithTag(component, 'input');
      expect(inputs.length).toBe(2);
    });
  });

});
