import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormConfigSelect, mapStateToProps} from 'app/Templates/components/FormConfigSelect';

describe('FormConfigInput', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      fields: {label: {}, content: {}, required: {}, filter: {}},
      values: {value: 'some value'},
      thesauri: [{_id: 1, name: 'thesauri1'}, {_id: 2, name: 'thesauri2'}],
      index: 0,
      updateProperty: jasmine.createSpy('updateProperty')
    };

    component = shallow(<FormConfigSelect {...props}/>);
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

  it('should render thesauri as options in content select', () => {
    let options = component.find('select').find('option');

    expect(options.last().text()).toBe('thesauri2');
    expect(options.last().props().value).toBe(2);
  });

  describe('mapStateToProps', () => {
    let state = {
      template: {
        data: Immutable.fromJS({name: '', properties: [{label: 'first property'}, {label: 'second property'}]}),
        uiState: Immutable.fromJS({thesauri: 'thesauri'})
      }
    };

    describe('initialValues', () => {
      it('should map the correct field to the props', () => {
        expect(mapStateToProps(state, props).initialValues).toEqual({label: 'first property'});
      });
    });

    describe('validation', () => {
      it('should return an error when the label is empty', () => {
        expect(mapStateToProps(state, props).validate({label: '', content: '1'})).toEqual({label: 'Required'});
      });

      it('should return an error when the content is empty', () => {
        expect(mapStateToProps(state, props).validate({label: 'I have a label', content: ''})).toEqual({content: 'Required'});
      });
    });
  });
});
