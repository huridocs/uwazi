import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';

import {SettingsNavigation} from '../SettingsNavigation';
import {actions} from 'app/BasicReducer';

describe('SettingsNavigation', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      section: Immutable.fromJS('account'),
      setSection: jasmine.createSpy('setSection')
    };
    component = shallow(<SettingsNavigation {...props} />);
  });

  describe('render()', () => {
    it('should render the correct active button', () => {
      expect(component.find('.active').node.props.children).toBe('Account');
      props.section = Immutable.fromJS('collection');
      component = shallow(<SettingsNavigation {...props} />);
      expect(component.find('.active').node.props.children).toBe('Collection');
    });
  });

  describe('navigation', () => {
    it('should set the correct section', () => {
      spyOn(actions, 'set');
      component.find('.list-group').childAt(1).simulate('click');
      expect(props.setSection).toHaveBeenCalledWith('collection');
    });
  });
});
