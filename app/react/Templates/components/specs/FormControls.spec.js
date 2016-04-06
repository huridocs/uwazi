import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormControls, mapStateToProps} from 'app/Templates/components/FormControls';

describe('FormControls', () => {
  let component;
  let props;
  let handleSubmit = (callback) => {
    callback(props.values);
  };

  beforeEach(() => {
    props = {
      fields: {name: {}, properties: []},
      values: {value: 'some value'},
      saveTemplate: jasmine.createSpy('saveTemplate'),
      handleSubmit
    };

    component = shallow(<FormControls {...props}/>);
  });

  describe('clicking save button', () => {
    it('should call saveTemplate action with the template in props', () => {
      component.find('.save-template').simulate('click');
      expect(props.saveTemplate).toHaveBeenCalledWith(props.values);
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
