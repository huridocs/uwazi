import React from 'react';
import Immutable from 'immutable';
import {shallow} from 'enzyme';

import {NeedAuthorization, mapStateToProps} from '../NeedAuthorization';

describe('NeedAuthorization', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {authorized: true};
  });

  let render = () => {
    component = shallow(<NeedAuthorization {...props}><div/></NeedAuthorization>);
  };

  describe('when authorized', () => {
    it('should render children', () => {
      render();
      expect(component.find('div').length).toBe(1);
    });
  });

  describe('when not authorized', () => {
    it('should render children', () => {
      props.authorized = false;
      render();
      expect(component.find('div').length).toBe(0);
    });
  });

  describe('maped state', () => {
    it('should map authorized true if user in the store', () => {
      let store = {
        user: Immutable.fromJS({_id: 1, role: 'admin'})
      };
      let state = mapStateToProps(store, {roles: ['admin']});
      expect(state).toEqual({authorized: true});
    });

    it('should map authorized false if user not in the store', () => {
      let store = {
        user: Immutable.fromJS({})
      };
      let state = mapStateToProps(store, {roles: ['admin']});
      expect(state).toEqual({authorized: false});
    });
  });
});
