import Immutable from 'immutable';
import React from 'react';

import { ConnectionsGroups, ConnectionsList } from 'app/ConnectionsList';
import { ShowMetadata } from 'app/Metadata';
import { shallow } from 'enzyme';
import { FileList } from 'app/Attachments/components/FileList';
import { EntityViewer, mapStateToProps } from '../EntityViewer';

describe('EntityViewer', () => {
  let component;
  let props;
  let instance;

  beforeEach(() => {
    props = {
      entity: Immutable.fromJS({
        title: 'Entity Title',
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
      deleteConnection: jasmine.createSpy('deleteConnection'),
      startNewConnection: jasmine.createSpy('startNewConnection'),
      deleteEntity: jasmine.createSpy('deleteEntity'),
      showTab: jasmine.createSpy('showTab'),
      params: { tabView: 'info' },
      mainContext: { confirm: jasmine.createSpy('confirm') },
    };
  });

  const render = () => {
    component = shallow(<EntityViewer {...props} />);
    instance = component.instance();
  };

  it('should render the header on all but "page" view', () => {
    render();
    const headerSelector = '.content-header';
    const h1Selector = `${headerSelector} > .content-header-title h1`;
    expect(component.find(h1Selector).text()).toBe('Entity Title');

    component.setProps({ tab: 'page' });

    expect(component.find(headerSelector).length).toBe(0);
  });

  it('should render the ConnectionsGroups', () => {
    render();
    const connectionsGroupsComponent = component.find(ConnectionsGroups);
    expect(connectionsGroupsComponent.length).toBe(1);
  });

  it('should render the ConnectionsList passing deleteConnection as prop', () => {
    render();

    component.find(ConnectionsList).props().deleteConnection({ sourceType: 'not metadata' });
    expect(props.mainContext.confirm).toHaveBeenCalled();
  });

  it('should render a FileList with the entity documents', () => {
    render();
    expect(component.find(FileList).props().files).toEqual(props.entity.toJS().documents);
    expect(component.find(FileList).props().entity).toEqual(props.entity.toJS());
  });

  it('should render the inherited properties of an entity', () => {
    render();
    expect(component.find(ShowMetadata).props().relationships.size).toBe(1);
    expect(component.find(ShowMetadata).props().relationships.toJS()).toEqual(
      props.entity.toJS().relations
    );
  });

  describe('deleteConnection', () => {
    beforeEach(() => {
      render();
    });

    it('should confirm deleting a Reference', () => {
      instance.deleteConnection({});
      expect(props.mainContext.confirm).toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });

    it('should delete the reference upon accepting', () => {
      const ref = { _id: 'r1' };
      instance.deleteConnection(ref);
      props.mainContext.confirm.calls.argsFor(0)[0].accept();
      expect(props.deleteConnection).toHaveBeenCalledWith(ref);
    });

    it('should not atempt to delete references whos source is metadata', () => {
      const ref = { _id: 'r1', sourceType: 'metadata' };
      instance.deleteConnection(ref);
      expect(props.mainContext.confirm).not.toHaveBeenCalled();
      expect(props.deleteConnection).not.toHaveBeenCalled();
    });
  });

  describe('Side panel', () => {
    it('should have the sidepanel open by default', () => {
      render();
      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(true);
      expect(component.find('.entity-relationships').prop('open')).toBe(true);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(false);
    });

    it('should have the sidepanel closed by default when entity has page view', () => {
      props.hasPageView = true;
      render();
      expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(false);
      expect(component.find('.entity-relationships').prop('open')).toBe(false);
      expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(true);
    });

    describe('toggling the side panel', () => {
      beforeEach(() => {
        render();
        component.find('.closeSidepanel').simulate('click');
        component.update();
      });

      it('should close the side panel when close button is clicked', () => {
        expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(false);
        expect(component.find('.entity-relationships').prop('open')).toBe(false);
        expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(true);
      });

      it('should reveal side panel when context menu is clicked', () => {
        expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(false);

        component.find('.show-info-sidepanel-menu').prop('openPanel')();
        component.update();

        expect(component.find('.entity-viewer').hasClass('with-panel')).toBe(true);
        expect(component.find('.entity-relationships').prop('open')).toBe(true);
        expect(component.find('.show-info-sidepanel-context-menu').prop('show')).toBe(false);
      });
    });
  });

  describe('mapStateToProps', () => {
    let state;

    beforeEach(() => {
      state = {
        entityView: {
          entity: Immutable.fromJS({ template: '1' }),
          entityForm: {},
          uiState: Immutable.fromJS({ tab: 'connections', userSelectedTab: false }),
        },
        templates: Immutable.fromJS([
          { _id: '1', entityViewPage: false },
          { _id: '2', entityViewPage: 'somePage' },
        ]),
        relationTypes: Immutable.fromJS([]),
        relationships: { list: { connectionsGroups: '' } },
      };
    });

    describe('When no user selected tab', () => {
      it('should set tab to info if entity doesnt have "hasPageView"', () => {
        const mappedProps = mapStateToProps(state);
        expect(mappedProps.hasPageView).toBe(false);
        expect(mappedProps.tab).toBe('info');
      });

      it('should set tab to page if entity has "hasPageView"', () => {
        state.entityView.entity = state.entityView.entity.set('template', '2');
        const mappedProps = mapStateToProps(state);
        expect(mappedProps.hasPageView).toBe(true);
        expect(mappedProps.tab).toBe('page');
      });
    });

    describe('When user selected tab', () => {
      it('should respect passed tab', () => {
        state.entityView.uiState = state.entityView.uiState.set('userSelectedTab', true);
        const mappedProps = mapStateToProps(state);
        expect(mappedProps.tab).toBe('connections');
      });
    });
  });
});
