import React from 'react';
import TestUtils from 'react-addons-test-utils';
import {FormConfigInput, mapStateToProps} from '~/controllers/Templates/FormConfigInput';
import Immutable from 'Immutable';


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

    component = TestUtils.renderIntoDocument(<FormConfigInput {...props}/>);
  });

  it('should not destroy the world', (done) => {
    expect(true).toBe(true);
    let form = TestUtils.findRenderedDOMComponentWithTag(component, 'form');
    TestUtils.Simulate.change(form);
    setTimeout(() => {
      expect(props.updateProperty).toHaveBeenCalledWith(props.values, props.index);
      done();
    });
  });

  describe('mapStateToProps', () => {
    it('should map the correct field to the props', () => {
      let state = {
        fields: Immutable.fromJS([{label: 'first property'}, {label: 'second property'}])
      };
      props = {index: 0};
      expect(mapStateToProps(state, props)).toEqual({initialValues: {label: 'first property'}});
    });
  });
});
