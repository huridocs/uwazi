import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormControls, mapStateToProps} from 'app/Templates/components/FormControls';

describe('FormControls', () => {
  let component;
  let props;
  let handleSubmit = (callback) => {
    return () => callback(props.values);
  };

  beforeEach(() => {
    props = {
      fields: {name: {}, properties: []},
      values: {value: 'some value'},
      saveTemplate: jasmine.createSpy('saveTemplate'),
      properties: [{type: 'text', label: 'text', localID: 'propId'}],
      touchWithKey: jasmine.createSpy('touchWithKey'),
      touch: jasmine.createSpy('touch'),
      handleSubmit
    };

    component = shallow(<FormControls {...props}/>);
  });

  describe('submiting the form', () => {
    it('should call saveTemplate action with the template in props', () => {
      component.find('form').simulate('submit', {preventDefault: () => {}});
      expect(props.saveTemplate).toHaveBeenCalledWith(props.values);
    });

    it('should touch all the subforms fields', () => {
      component.find('form').simulate('submit', {preventDefault: () => {}});
      expect(props.touchWithKey).toHaveBeenCalledWith('template', 'propId', 'content', 'label', 'required', 'filter');
      expect(props.touch).toHaveBeenCalledWith('template', 'name');
    });
  });

  describe('initialValues', () => {
    it('should map the correct field to the props', () => {
      let state = {template: {data: Immutable.fromJS({name: 'name', properties: []})}};
      expect(mapStateToProps(state).initialValues).toEqual({name: 'name', properties: []});
    });
  });

  describe('validation', () => {
    let state = {template: {data: Immutable.fromJS({name: 'name', properties: []})}};

    it('should retun error when the template has no name', () => {
      let values = {name: '', properties: []};
      expect(mapStateToProps(state).validate(values)).toEqual({name: 'Required', properties: []});
    });

    it('should retun error when a property has no label', () => {
      let values = {name: 'I have name', properties: [{label: ''}]};
      expect(mapStateToProps(state).validate(values)).toEqual({properties: [{label: 'Required'}]});
    });

    it('should retun error when properties has same labels', () => {
      let values = {name: 'I have name',
        properties: [{label: 'label 1', localID: 1}, {label: 'label 2', localID: 2}, {label: 'label 1', localID: 3}]
      };
      expect(mapStateToProps(state).validate(values)).toEqual({properties: [{label: 'Duplicated'}, {}, {label: 'Duplicated'}]});
    });

    it('should retun error when a property type select has no content', () => {
      let values = {name: 'I have name', properties: [{label: 'I do have label', type: 'select'}]};
      expect(mapStateToProps(state).validate(values)).toEqual({properties: [{content: 'Required'}]});
    });

    it('should retun error when a property type list has no content', () => {
      let values = {name: 'I have name', properties: [{label: 'I do have label', type: 'list'}]};
      expect(mapStateToProps(state).validate(values)).toEqual({properties: [{content: 'Required'}]});
    });
  });
});
