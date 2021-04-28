import Immutable from 'immutable';
import React from 'react';

import { ConnectionsGroups, ConnectionsList } from 'app/ConnectionsList';
import { ShowMetadata } from 'app/Metadata';
import { shallow } from 'enzyme';
import { FileList } from 'app/Attachments/components/FileList';
import { EntityViewer } from '../EntityViewer';

describe('EntityViewer', () => {
  let component;
  let props;
  let context;
  let instance;

  beforeEach(() => {
    context = { confirm: jasmine.createSpy('confirm') };
    props = {
      entity: Immutable.fromJS({
        title: 'Title',
        documents: [{ _id: '123', title: 'Test doc' }],
        relations: [{ template: null, entity: '123', hub: 'abc' }],
      }),
      templates: Immutable.fromJS([
        {
          _id: 'template1',
          properties: [{ name: 'source_property', label: 'label1' }],
          name: 'template1Name',
        },
        {
          _id: 'template2',
          properties: [{ name: 'source_property', label: 'label2' }],
          name: 'template2Name',
        },
      ]),
      relationships: Immutable.fromJS([{ template: null, entity: '123', hub: 'abc' }]),
      relationTypes: [{ _id: 'abc', name: 'relationTypeName' }],
      connectionsGroups: Immutable.fromJS([
        { key: 'g1', templates: [{ _id: 't1', count: 1 }] },
        {
          key: 'g2',
          templates: [
            { _id: 't2', count: 2 },
            { _id: 't3', count: 3 },
          ],
        },
      ]),
      hubs: Immutable.fromJS([
        {
          hub: '1',
          rightRelationships: [
            { template: 'g1', relationships: [{ entityData: { template: 't1' } }] },
          ],
        },
      ]),
      deleteConnection: jasmine.createSpy('deleteConnection'),
      startNewConnection: jasmine.createSpy('startNewConnection'),
      deleteEntity: jasmine.createSpy('deleteEntity'),
      showTab: jasmine.createSpy('showTab'),
    };
  });

  const render = () => {
    component = shallow(<EntityViewer {...props} />, { context });
    instance = component.instance();
  };

  it('should render the ConnectionsGroups', () => {
    render();
    const connectionsGroupsComponent = component.find(ConnectionsGroups);
    expect(connectionsGroupsComponent.length).toBe(1);
    const { connectionsGroups } = connectionsGroupsComponent.props();
    expect(connectionsGroups.size).toEqual(1);
    expect(connectionsGroups.get(0).get('key')).toEqual('g1');
  });

  it('should render the ConnectionsList passing deleteConnection as prop', () => {
    render();

    component
      .find(ConnectionsList)
      .props()
      .deleteConnection({ sourceType: 'not metadata' });
    expect(context.confirm).toHaveBeenCalled();
  });

  it('should render a FileList with the entity documents', () => {
    render();
    expect(component.find(FileList).props().files).toEqual(props.entity.toJS().documents);
    expect(component.find(FileList).props().entity).toEqual(props.entity.toJS());
  });

  it('should render the inherited properties of an entity', () => {
    render();
    expect(component.find(ShowMetadata).props().relationships.size).toBe(1);
    expect(
      component
        .find(ShowMetadata)
        .props()
        .relationships.toJS()
    ).toEqual(props.entity.toJS().relations);
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
      const ref = { _id: 'r1' };
      instance.deleteConnection(ref);
      context.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteConnection).toHaveBeenCalledWith(ref);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref = { _id: 'r1', sourceType: 'metadata' };
      instance.deleteConnection(ref);
      expect(context.confirm).not.toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });
  });

  describe('closing side panel', () => {
    beforeEach(() => {
      render();
      component.find('.closeSidepanel').simulate('click');
      component.update();
    });
    it('should close the side panel when close button is clicked', () => {
      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(false);
      expect(component.find('.entity-connections').prop('open')).toBe(false);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(true);
    });
    it('should reveal side panel when context menu is clicked', () => {
      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(false);

      component.find('.show-info-sidepanel-menu').prop('openPanel')();
      component.update();

      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(true);
      expect(component.find('.entity-connections').prop('open')).toBe(true);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(false);
    });
  });
});
