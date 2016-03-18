import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';
import InputField from '../InputField.js';

describe('InputField', () => {
  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<InputField value='test_value'/>);
  });

  describe('on instance', () => {
    it('should set value passed as input value', () => {
      expect(component.value()).toBe('test_value');
    });
  });

  describe('handleChange', () => {
    it('should set field value on state', () => {
      component.field.value = 'Bane';
      component.handleChange();
      expect(component.state.value).toBe('Bane');
    });
  });

  describe('value()', () => {
    it('should return the input value', () => {
      component.field.value = 'Bane';
      expect(component.value()).toBe('Bane');

      component.field.value = 'Deadshot';
      expect(component.value()).toBe('Deadshot');
    });
  });

  describe('componentDidUpdate()', () => {
    it('should set state.value with new props.value', () => {
      //render the component again using reactDom forces the component to update itself
      ReactDOM.render(<InputField value='deadshot'/>, ReactDOM.findDOMNode(component).parentNode);
      expect(component.state.value).toBe('deadshot');
    });
  });
});
