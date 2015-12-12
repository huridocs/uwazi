import React, { Component, PropTypes } from 'react'
import ReactDOM from 'react-dom'
import TestUtils from 'react-addons-test-utils'

import ConfigFieldPanel from '../ConfigFieldPanel'

describe('ConfigFieldForm', () => {

  let component;

  beforeEach(() => {
    component = TestUtils.renderIntoDocument(<ConfigFieldPanel/>);
  });

  describe('on instance', () => {
    it('should set modal show state to false', () => {
      expect(component.state.showModal).toBe(false);
    });

    it('should initialize fields object', () => {
      expect(component.fields).toEqual({});
    });
  });

  describe('toggleModel', () => {
    it('toggle showModal state true/false', () => {
      expect(component.state.showModal).toBe(false);
      component.toggleModal()
      expect(component.state.showModal).toBe(true);
      component.toggleModal()
      expect(component.state.showModal).toBe(false);
    });
  });

  describe('save', () => {
    it('should toogleModal and call save function with value map of the fields', (done) => {

      let save_function = (values) => {
        expect(values).toEqual({property1:1, property2:2});
        expect(component.toggleModal).toHaveBeenCalled();
        done();
      };

      component = TestUtils.renderIntoDocument(<ConfigFieldPanel save={save_function}/>);
      spyOn(component, 'toggleModal');
      component.fields = {property1: {value: () => 1}, property2: {value: () => 2}};

      let event = {preventDefault: () => {}};

      component.save(event);
    });

    describe("when a field has no value function", () => {
      it("should throw an error pointing which field is", () => {

        component.fields = {property1: {value: () => 1}, property2: {value: () => 2}, property3: {}};
        let event = {preventDefault: () => {}};

        expect(component.save.bind(component, event)).toThrow('property3 has no value function !');

      });
    });

  });

});
