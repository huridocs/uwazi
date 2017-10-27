import React from 'react';
import {shallow} from 'enzyme';

import {ToggleStyleButtons, mapStateToProps} from '../ToggleStyleButtons';

describe('ToggleStyleButtons', () => {
  let component;
  let props;

  beforeEach(() => {
    props = {
      view: 'another',
      switchView: jasmine.createSpy('switchView')
    };
  });

  let render = () => {
    component = shallow(<ToggleStyleButtons {...props} />);
  };

  it('should hold two buttons that switch view to list and graph', () => {
    render();
    expect(props.switchView).not.toHaveBeenCalled();

    component.find('button').at(0).simulate('click');
    expect(props.switchView).toHaveBeenCalledWith('list');
    props.switchView.calls.reset();

    component.find('button').at(1).simulate('click');
    expect(props.switchView).toHaveBeenCalledWith('graph');
  });

  describe('mapStateToProps', () => {
    it('should pass current view', () => {
      const state = {connectionsList: {view: 'currentView'}};
      expect(mapStateToProps(state).view).toBe('currentView');
    });
  });
});
