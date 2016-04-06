import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormConfigInput, mapStateToProps} from 'app/Templates/components/FormConfigInput';

describe('FormConfigInput', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      fields: {label: {}, required: {}, filter: {}},
      values: {value: 'some value'},
      index: 0,
      updateProperty: jasmine.createSpy('updateProperty')
    };

    component = shallow(<FormConfigInput {...props}/>);
  });

  describe('when form changes', () => {
    it('should updateProperty', (done) => {
      component.find('form').simulate('change');

      setTimeout(() => {
        expect(props.updateProperty).toHaveBeenCalledWith(props.values, props.index);
        done();
      });
    });
  });

  describe('initialValues', () => {
    it('should map the correct field to the props', () => {
      let state = {
        template: {data: Immutable.fromJS({name: '', properties: [{label: 'first property'}, {label: 'second property'}]})}
      };
      props = {index: 0};
      expect(mapStateToProps(state, props).initialValues).toEqual({label: 'first property'});
    });
  });

  describe('validation', () => {
    it('should return an error when the label is empty', () => {
      let state = {
        template: {data: Immutable.fromJS({name: '', properties: [{label: 'first property'}, {label: 'second property'}]})}
      };
      props = {index: 0};
      expect(mapStateToProps(state, props).validate({label: ''})).toEqual({label: 'Required'});
    });
  });
});
