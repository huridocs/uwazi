import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {mapStateToProps, ThesauriForm} from 'app/Thesauris/components/ThesauriForm.js';

describe('ThesauriForm', () => {
  let props;
  let component;
  beforeEach(() => {
    props = {
      thesauri: {name: 'thesauri name', values: []},
      state: {fields: []},
      resetForm: jasmine.createSpy('resetForm'),
      setInitial: jasmine.createSpy('setInitial'),
      thesauris: Immutable.fromJS([{name: 'Countries'}])
    };

    component = shallow(<ThesauriForm {...props}/>);
  });

  describe('when unmount', () => {
    it('shoould reset the form', () => {
      component.unmount();
      expect(props.resetForm).toHaveBeenCalled();
      expect(props.setInitial).toHaveBeenCalled();
    });
  });

  describe('mapStateToProps', () => {
    let state;
    beforeEach(() => {
      state = {
        thesauri: {
          data: {name: 'thesauri name', values: []},
          state: 'thesauri form state'
        },
        thesauris: Immutable.fromJS([{name: 'Countries'}])
      };
    });

    it('should map the thesauri to initialValues', () => {
      expect(mapStateToProps(state).thesauri).toEqual({name: 'thesauri name', values: []});
      expect(mapStateToProps(state).thesauris).toEqual(Immutable.fromJS([{name: 'Countries'}]));
    });
  });
});
