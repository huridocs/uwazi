import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {FormName, mapStateToProps} from 'app/Templates/components/FormName';

describe('FormName', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      fields: {name: {}},
      values: {value: 'some value'},
      updateTemplate: jasmine.createSpy('updateTemplate')
    };

    component = shallow(<FormName {...props}/>);
  });

  describe('when form changes', () => {
    it('should updateProperty', (done) => {
      component.find('form').simulate('change');

      setTimeout(() => {
        expect(props.updateTemplate).toHaveBeenCalledWith(props.values);
        done();
      });
    });
  });

  describe('mapStateToProps', () => {
    it('should map the correct field to the props', () => {
      let state = {
        template: {data: Immutable.fromJS({name: 'name'})}
      };
      expect(mapStateToProps(state)).toEqual({initialValues: {name: 'name'}});
    });
  });
});
