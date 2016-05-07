import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {mapStateToProps, RelationTypeForm} from 'app/RelationTypes/components/RelationTypeForm.js';

describe('RelationTypeForm', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      fields: {name: {}},
      resetRelationType: jasmine.createSpy('resetRelationType'),
      handleSubmit: jasmine.createSpy('handleSubmit')
    };

    component = shallow(<RelationTypeForm {...props}/>);
  });

  describe('when unmount', () => {
    it('shoould call resetRelationType', () => {
      component.unmount();
      expect(props.resetRelationType).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    let state;
    beforeEach(() => {
      state = {
        relationType: Immutable.fromJS({name: 'relationType name'})
      };
    });

    it('should map the relationType to initialValues', () => {
      expect(mapStateToProps(state).initialValues).toEqual({name: 'relationType name'});
    });

    it('should map the fields', () => {
      expect(mapStateToProps(state).fields).toEqual(['name', '_id', '_rev']);
    });

    describe('validation', () => {
      it('should add an error if the template has no name', () => {
        let errors = mapStateToProps(state).validate({name: ''});
        expect(errors.name).toBe('Required');
      });
    });
  });
});
