import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormConfigInput, mapStateToProps} from 'app/Templates/components/FormConfigInput';

describe('FormConfigInput', () => {
  let component;
  let props;

  function renderComponent(label = 'test', type = 'checkbox') {
    props = {
      fields: {label: {value: label}, required: {}, filter: {value: true}, type: {value: type}},
      values: {label, type, filter: true},
      index: 0,
      parentTemplateId: 'template1',
      templates: [
        {_id: 'template1', properties: [
          {localID: 1, label: label, filter: true, type},
          {localID: 2, label: 'something else'}
        ]},
        {_id: 'template2', name: 'Template 2', properties: [
          {label: 'Date', type: 'date', filter: true},
          {label: 'Author', type: 'text', filter: true}
        ]},
        {_id: 'template3', name: 'Template 3', properties: [
          {label: 'Date', type: 'date', filter: true},
          {label: 'Keywords', type: 'text', filter: true}
        ]}
      ]
    };

    component = shallow(<FormConfigInput {...props}/>);
  }

  beforeEach(renderComponent);

  describe('initialValues', () => {
    it('should map the correct field to the props', () => {
      let state = {
        template: {
          data: Immutable.fromJS({name: '', properties: [{label: 'first property'}, {label: 'second property'}]}),
          uiState: Immutable.fromJS({})
        }
      };
      props = {index: 0};
      expect(mapStateToProps(state, props).initialValues).toEqual({label: 'first property'});
    });
  });

  describe('validation', () => {
    it('should return an error when the label is empty', () => {
      let state = {
        template: {
          data: Immutable.fromJS({name: '', properties: [{label: ''}, {label: 'second property'}]}),
          uiState: Immutable.fromJS({})
        }
      };
      props = {index: 0};
      expect(mapStateToProps(state, props).validate()).toEqual({label: 'Required'});
    });
  });
});
