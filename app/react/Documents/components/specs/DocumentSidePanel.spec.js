import React from 'react';
import {shallow} from 'enzyme';
import {fromJS} from 'immutable';

import {DocumentSidePanel, mapStateToProps} from '../DocumentSidePanel';
import SidePanel from 'app/Layout/SidePanel';
import Connections from 'app/Viewer/components/ConnectionsList';
import {Tabs} from 'react-tabs-redux';
import Immutable from 'immutable';

import * as viewerModule from 'app/Viewer';

describe('DocumentSidePanel', () => {
  let component;
  let props;
  let context;

  beforeEach(() => {
    props = {
      doc: Immutable.fromJS({metadata: [], attachments: [], type: 'document', file: {}}),
      rawDoc: fromJS({}),
      showModal: jasmine.createSpy('showModal'),
      openPanel: jasmine.createSpy('openPanel'),
      startNewConnection: jasmine.createSpy('startNewConnection'),
      references: Immutable.fromJS(['reference']),
      connections: Immutable.fromJS(['connections']),
      formPath: 'formPath'
    };
  });

  context = {
    confirm: jasmine.createSpy('confirm')
  };

  let render = () => {
    component = shallow(<DocumentSidePanel {...props}/>, {context});
  };

  it('should have default props values assigned', () => {
    render();
    expect(component.instance().props.tocFormComponent()).toBe(false);
    expect(component.instance().props.EntityForm()).toBe(false);
  });

  it('should render a SidePanel', () => {
    render();

    expect(component.find(SidePanel).length).toBe(1);
    expect(component.find(SidePanel).props().open).toBeUndefined();
  });

  describe('when props.open', () => {
    it('should open SidePanel', () => {
      props.open = true;
      render();

      expect(component.find(SidePanel).props().open).toBe(true);
    });
  });

  describe('connections', () => {
    it('should render 2 connections list, for connections and references', () => {
      expect(component.find(Connections).at(0).props().references).toEqual(props.references);
      expect(component.find(Connections).at(1).props().references).toEqual(props.connections);
    });
  });

  describe('Tabs', () => {
    it('should set metadata as default tab', () => {
      props.tab = '';
      render();
      expect(component.find(Tabs).at(0).props().selectedTab).toBe('metadata');
    });

    it('should set tab in props as selected', () => {
      props.tab = 'selected-tab';
      render();
      expect(component.find(Tabs).at(0).props().selectedTab).toBe('selected-tab');
    });

    describe('when doc passed is an entity', () => {
      it('should set metadata as selected if tab is toc', () => {
        props.doc = Immutable.fromJS({metadata: [], attachments: [], type: 'entity'});
        props.tab = 'toc';
        render();
        expect(component.find(Tabs).at(0).props().selectedTab).toBe('metadata');
      });
      it('should set metadata as selected if tab is references', () => {
        props.doc = Immutable.fromJS({metadata: [], attachments: [], type: 'entity'});
        props.tab = 'references';
        render();
        expect(component.find(Tabs).at(0).props().selectedTab).toBe('metadata');
      });
    });
  });

  describe('close', () => {
    describe('when form is dirty', () => {
      it('should confirm', () => {
        props.formDirty = true;
        render();
        component.find('i.close-modal').simulate('click');
        expect(context.confirm).toHaveBeenCalled();
      });
    });

    describe('when form is not dirty', () => {
      it('should close panel and reset form', () => {
        props.closePanel = jasmine.createSpy('closePanel');
        props.resetForm = jasmine.createSpy('resetForm');
        props.formDirty = false;
        props.docBeingEdited = true;
        props.formPath = 'formPath';
        render();

        component.find('i.close-modal').simulate('click');

        expect(props.closePanel).toHaveBeenCalled();
        expect(props.resetForm).toHaveBeenCalledWith('formPath');
      });
    });
  });

  describe('mapStateToProps', () => {
    let state;

    beforeEach(() => {
      state = {
        documentViewer: {targetDoc: Immutable.fromJS({_id: null})},
        relationships: {list: {connectionsGroups: 'connectionsGroups'}},
        relationTypes: Immutable.fromJS(['a', 'b'])
      };
      spyOn(viewerModule.selectors, 'parseReferences').and.callFake((doc, refs) => `Parsed ${doc} refs: ${refs}`);
      spyOn(viewerModule.selectors, 'selectReferences').and
      .callFake(fakeState => `References selector used ${fakeState === state ? 'correctly' : 'incorrectly'}`);
      spyOn(viewerModule.selectors, 'selectTargetReferences').and
      .callFake(fakeState => `Target references selector used ${fakeState === state ? 'correctly' : 'incorrectly'}`);
    });

    it('should map parsed references from ownProps if present and set the excludeConnectionsTab to true', () => {
      const ownProps = {doc: 'fullDocData', references: 'allRefs'};
      expect(mapStateToProps(state, ownProps).references).toBe('Parsed fullDocData refs: allRefs');
      expect(mapStateToProps(state, ownProps).excludeConnectionsTab).toBe(true);
    });

    it('should map selected references from viewer when no ownProps and not targetDoc', () => {
      const ownProps = {};
      expect(mapStateToProps(state, ownProps).references).toBe('References selector used correctly');
      expect(mapStateToProps(state, ownProps).excludeConnectionsTab).toBe(false);
    });

    it('should map selected target references from viewer when no ownProps and targetDoc', () => {
      const ownProps = {};
      state.documentViewer.targetDoc = Immutable.fromJS({_id: 'targetDocId'});
      expect(mapStateToProps(state, ownProps).references).toBe('Target references selector used correctly');
      expect(mapStateToProps(state, ownProps).excludeConnectionsTab).toBe(false);
    });

    it('should map connectionsGroups and hasRelationTypes', () => {
      const ownProps = {};
      expect(mapStateToProps(state, ownProps).connectionsGroups).toBe('connectionsGroups');
      expect(mapStateToProps(state, ownProps).hasRelationTypes).toBe(true);

      state.relationTypes = Immutable.fromJS([]);
      expect(mapStateToProps(state, ownProps).hasRelationTypes).toBe(false);
    });
  });
});
