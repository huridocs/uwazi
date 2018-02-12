import React from 'react';
import {shallow} from 'enzyme';
import {fromJS as Immutable} from 'immutable';

import {EntityViewer} from '../EntityViewer';

import {ConnectionsGroups, ConnectionsList} from 'app/ConnectionsList';

describe('EntityViewer', () => {
  let component;
  let props;
  let context;
  let instance;

  beforeEach(() => {
    context = {confirm: jasmine.createSpy('confirm')};
    props = {
      entity: {title: 'Title'},
      templates: [
        {_id: 'template1', properties: [{name: 'source_property', label: 'label1'}], name: 'template1Name'},
        {_id: 'template2', properties: [{name: 'source_property', label: 'label2'}], name: 'template2Name'}
      ],
      relationTypes: [{_id: 'abc', name: 'relationTypeName'}],
      connectionsGroups: Immutable([
        {key: 'g1', templates: [{_id: 't1', count: 1}]},
        {key: 'g2', templates: [{_id: 't2', count: 2}, {_id: 't3', count: 3}]}
      ]),
      deleteConnection: jasmine.createSpy('deleteConnection'),
      startNewConnection: jasmine.createSpy('startNewConnection')
    };
  });

  let render = () => {
    component = shallow(<EntityViewer {...props} />, {context});
    instance = component.instance();
  };

  it('should render the ConnectionsGroups', () => {
    render();

    expect(component.find(ConnectionsGroups).length).toBe(1);
  });

  it('should render the ConnectionsList passing deleteConnection as prop', () => {
    render();

    component.find(ConnectionsList).props().deleteConnection({sourceType: 'not metadata'});
    expect(context.confirm).toHaveBeenCalled();
  });

  describe('deleteConnection', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      instance.deleteConnection({});
      expect(context.confirm).toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      const ref = {_id: 'r1'};
      instance.deleteConnection(ref);
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteConnection).toHaveBeenCalledWith(ref);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref = {_id: 'r1', sourceType: 'metadata'};
      instance.deleteConnection(ref);
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });
  });
});
