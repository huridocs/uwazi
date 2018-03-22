import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {ActionButton, mapStateToProps} from '../ActionButton';

describe('ActionButton', () => {
  let component;
  let props;
  const connections = {
    basic: Immutable({
      sourceDocument: 'sourceId',
      targetDocument: 'targetId',
      template: 'template',
      type: 'basic'
    }),
    ranged: Immutable({
      sourceDocument: 'sourceId',
      sourceRange: 'sourceRange',
      targetDocument: 'targetId',
      template: 'template',
      type: 'ranged'
    })
  };

  beforeEach(() => {
    props = {
      type: 'basic',
      connection: connections.basic,
      saveConnection: jasmine.createSpy('saveConnection'),
      selectRangedTarget: jasmine.createSpy('selectRangedTarget'),
      action: 'save',
      onCreate: () => {},
      onRangedConnect: () => {}
    };
  });

  function render() {
    component = shallow(<ActionButton {...props} />);
  }

  function expectDisabledSave() {
    render();
    const button = component.find('button');

    button.simulate('click');

    expect(button.props().disabled).toBe(true);
    expect(props.saveConnection).not.toHaveBeenCalled();
  }

  function unsetRequiredProperty(property, connectionType = 'basic') {
    props.type = connectionType;
    props.connection = connections[connectionType].set(property, '');
  }

  describe('When action is save', () => {
    it('should save the connection when data complete', () => {
      render();
      component.find('button').simulate('click');
      expect(component.find('button').props().disabled).toBe(false);
      expect(props.saveConnection).toHaveBeenCalledWith(props.connection.toJS(), props.onCreate);
    });

    describe('Basic connection', () => {
      it('should not save the sourceRange if one is selected', () => {
        props.connection = connections.basic.set('sourceRange', 'uselessRange');
        render();
        component.find('button').simulate('click');
        expect(props.saveConnection).toHaveBeenCalledWith(props.connection.delete('sourceRange').toJS(), props.onCreate);
      });
    });

    describe('Ranged connection', () => {
      it('should save the sourceRange', () => {
        props.type = 'ranged';
        props.connection = connections.ranged;
        render();
        component.find('button').simulate('click');
        expect(props.saveConnection).toHaveBeenCalledWith(props.connection.toJS(), props.onCreate);
      });
    });

    describe('When busy', () => {
      it('should disable button and not attempt to save', () => {
        props.busy = true;
        expectDisabledSave();
      });
    });

    describe('When incomplete data', () => {
      it('should disable button and not attempt to save', () => {
        unsetRequiredProperty('sourceDocument');
        expectDisabledSave();

        unsetRequiredProperty('targetDocument');
        expectDisabledSave();

        unsetRequiredProperty('template');
        expectDisabledSave();

        unsetRequiredProperty('sourceRange', 'ranged');
        expectDisabledSave();
      });
    });
  });

  describe('When action is connect', () => {
    it('should select ranged target', () => {
      props.action = 'connect';
      render();
      component.find('button').simulate('click');
      expect(props.saveConnection).not.toHaveBeenCalled();
      expect(props.selectRangedTarget).toHaveBeenCalledWith(props.connection.toJS(), props.onRangedConnect);
    });
  });

  describe('mapStateToProps', () => {
    let state;

    beforeEach(() => {
      state = {connections: {
        connection: props.connection,
        uiState: Immutable({creating: false, connecting: false})
      }};
    });

    it('should map type and connection and busy', () => {
      expect(mapStateToProps(state).type).toBe('basic');
      expect(mapStateToProps(state).connection).toBe(props.connection);
      expect(mapStateToProps(state).busy).toBe(false);
    });

    it('should set busy if creating', () => {
      state.connections.uiState = state.connections.uiState.set('creating', true);
      expect(mapStateToProps(state).busy).toBe(true);
    });

    it('should set busy if connecting', () => {
      state.connections.uiState = state.connections.uiState.set('connecting', true);
      expect(mapStateToProps(state).busy).toBe(true);
    });
  });
});
