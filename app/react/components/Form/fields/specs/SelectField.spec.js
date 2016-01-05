import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'
import { Link } from 'react-router'

import SelectField from '../SelectField.js'

describe('SelectField', () => {

  let component;
  let options = [
    {label: '1', value: '1'},
    {label: '2', value: '2'}
  ];

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<SelectField defaultValue='2' options={options}/>);
  });

  describe('value()', () => {
    it('should return the select value', () => {
      expect(component.value()).toBe('2');
    });
  });

  describe('onChange()', () => {
    it('should execute onChange callback passed in props', () => {
      let change_executed = false;
      let change = () => {
        change_executed = true;
      };

      component = TestUtils.renderIntoDocument(<SelectField defaultValue='2' options={options} onChange={change}/>);
      TestUtils.Simulate.change(component.field);

      expect(change_executed).toBe(true);

    });
  });

});
