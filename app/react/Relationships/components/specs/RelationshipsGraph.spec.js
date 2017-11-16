import React from 'react';
import {shallow} from 'enzyme';
import Immutable from 'immutable';
import Sticky from 'react-sticky-el';

import {RelationshipsGraph, mapStateToProps} from '../RelationshipsGraph';

import Doc from 'app/Library/components/Doc';
import Item from 'app/Layout/Item';

describe('RelationshipsGraph', () => {
  let component;
  let props;
  let stickyElement;

  beforeEach(() => {
    props = {
      parentEntity: {parentEntity: 'parentEntity'},
      connections: Immutable.fromJS({rows: [
        {_id: '1', connections: []}
      ], totalRows: 1}),
      search: {sort: 'sort'},
      clickOnDocument: jasmine.createSpy('clickOnDocument'),
      relationTypes: Immutable.fromJS([])
    };
  });

  let render = () => {
    component = shallow(<RelationshipsGraph {...props} />);
    stickyElement = component.find(Sticky);
  };

  describe('Collapse / Expand functionality', () => {
    beforeEach(() => {
      render();
    });

    it('should have a toggle collapsed button', () => {
      expect(component.state('collapsed')).toBe(true);

      component.find('button').at(0).simulate('click');
      expect(component.state('collapsed')).toBe(false);

      component.find('button').at(0).simulate('click');
      expect(component.state('collapsed')).toBe(true);
    });

    it('should render collapsed / expanded group', () => {
      expect(component.find('.group-wrapper > .group').length).toBe(1);
      expect(component.find('.group-wrapper > .group').props().className).toContain('group-collapse');

      component.find('button').at(0).simulate('click');

      expect(component.find('.group-wrapper > .group').length).toBe(1);
      expect(component.find('.group-wrapper > .group').props().className).not.toContain('group-collapse');
    });
  });

  describe('Parent Data', () => {
    beforeEach(() => {
      render();
    });

    it('should hold a sticky parent Doc', () => {
      expect(stickyElement.props().scrollElement).toBe('.entity-viewer');
      expect(stickyElement.props().boundaryElement).toBe('.group-row');
      expect(stickyElement.find(Doc).props()).toEqual({doc: {parentEntity: 'parentEntity'}, searchParams: props.search});
    });

    it('should display correct blank state', () => {
      expect(stickyElement.find('.item-connection').length).toBe(0);
    });

    it('should include a relationships hub if there is one or more connections', () => {
      props.connections = Immutable.fromJS({rows: [
        {_id: '1', connections: [{context: 'connectionType'}]}
      ], totalRows: 1});
      render();

      expect(stickyElement.find('.item-connection').length).toBe(1);
    });
  });

  describe('Relationships', () => {
    beforeEach(() => {
      props.relationTypes = Immutable.fromJS([{_id: 'type0'}, {_id: 'type1'}, {_id: 'type2'}, {_id: 'type3'}, {_id: 'type4'}]);
      props.connections = Immutable.fromJS({rows: [
        {_id: '1', connections: [{label: 'type3Label', context: 'type3'}, {label: 'type2Label', context: 'type2'}]},
        {_id: '2', connections: [{label: 'type2Label', context: 'type2'}]},
        {_id: '3', connections: [{label: 'type2Label', context: 'type2'}]},
        {_id: '4', connections: [{label: 'type4Label', context: 'type4'}]},
        {_id: '5', connections: [{label: 'type4Label', context: 'type4'}]}
      ], totalRows: 1});
      render();
    });

    function checkConnection({pos, type, asPrevious, lastOfType, _id}) {
      const connection = component.find('.target-connections .connection').at(pos);
      expect(connection.props().className).toBe(`connection${asPrevious ? ' as-previous' : ''}${lastOfType ? ' last-of-type' : ''}`);

      expect(connection.find(Item).props().className).toEqual('connection-data');
      expect(connection.find(Item).props().templates.toJS()).toEqual(props.relationTypes.toJS());
      expect(connection.find(Item).props().doc.toJS().label).toEqual(`type${type}Label`);
      expect(connection.find(Item).props().titleProperty).toEqual('label');

      expect(connection.find(Doc).props().doc.toJS())
      .toEqual({relationship: {label: `type${type}Label`, context: `type${type}`, typePostition: type}, lastOfType, asPrevious, _id});
    }

    it('should connect all relationships to the hub, grouping them by type', () => {
      expect(component.find('.target-connections .connection').length).toBe(6);

      checkConnection({pos: 0, type: 3, asPrevious: false, lastOfType: false, _id: '1'});
      checkConnection({pos: 1, type: 2, asPrevious: false, lastOfType: false, _id: '1'});
      checkConnection({pos: 2, type: 2, asPrevious: true, lastOfType: false, _id: '2'});
      checkConnection({pos: 3, type: 2, asPrevious: true, lastOfType: false, _id: '3'});
      checkConnection({pos: 4, type: 4, asPrevious: false, lastOfType: true, _id: '4'});
      checkConnection({pos: 5, type: 4, asPrevious: true, lastOfType: true, _id: '5'});
    });

    describe('Clicking on a document', () => {
      it('should call on props.clickOnDocument if present', () => {
        component.find(Doc).at(1).simulate('click', 'e', 'other args');
        expect(props.clickOnDocument.calls.mostRecent().args[0]).toBe('e');
        expect(props.clickOnDocument.calls.mostRecent().args[1]).toBe('other args');
      });
    });
  });

  describe('mapStateToProps', () => {
    it('should get parentEntity from EntityView, connectionsList and relationTypes', () => {
      const store = {
        entityView: {entity: 'storeEntity'},
        connectionsList: {searchResults: 'storeResults', sort: 'storeSort'},
        relationTypes: 'storeRelationTypes'
      };

      expect(mapStateToProps(store)).toEqual({
        parentEntity: 'storeEntity',
        connections: 'storeResults',
        search: 'storeSort',
        relationTypes: 'storeRelationTypes'
      });
    });
  });
});
