import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {mapStateToProps, RelationTypeForm} from 'app/RelationTypes/components/RelationTypeForm.js';

describe('RelationTypeForm', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      relationType: {name: 'test'},
      resetForm: jasmine.createSpy('resetForm'),
      handleSubmit: jasmine.createSpy('handleSubmit'),
      state: {fields: []}
    };

    component = shallow(<RelationTypeForm {...props}/>);
  });

  describe('when unmount', () => {
    it('shoould call resetRelationType', () => {
      component.unmount();
      expect(props.resetForm).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    let state;
    beforeEach(() => {
      state = {
        relationType: Immutable.fromJS({name: 'relationType name'})
      };
    });

    it('should map the relationType', () => {
      expect(mapStateToProps(state).relationType.toJS()).toEqual({name: 'relationType name'});
    });
  });
});
