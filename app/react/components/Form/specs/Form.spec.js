import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import Form from '../Form.js'

describe('Form', () => {

  let component;

  let fields = [{
    type:'input',
    label:'Input',
    name:'input1'
  },
  {
    type:'checkbox',
    label:'Input 2',
    name:'input2'
  }];

  let inputs;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<Form fields={fields}/>);
    inputs = TestUtils.scryRenderedDOMComponentsWithTag(component, 'input');
  });

  describe('on instance', () => {
    it('should render the form based on the fields', () => {
      expect(inputs.length).toBe(2);
    });
  });

  describe('value()', () => {
    it('should return a key value map', () => {
      inputs[0].value = 'test';
      inputs[1].checked = true;
      let value = component.value();
      expect(value).toEqual({input1:'test', input2:true});
    });
  });

  describe("when passing values", () => {
    it("should fill the fields", () => {
      let values = {input1:'bruce'};
      component = TestUtils.renderIntoDocument(<Form fields={fields} values={values}/>);

      let value = component.value();
      expect(value.input1).toBe('bruce');
    });
  });

});
