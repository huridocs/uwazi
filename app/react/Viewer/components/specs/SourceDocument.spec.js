import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';
import React from 'react';
import {shallow} from 'enzyme';

import SourceDocument from 'app/Viewer/components/SourceDocument';

describe('SourceDocument', function () {
  let component;
  let store;
  const mockStore = configureMockStore([]);

  let state = {
    user: Immutable.fromJS({_id: 1}),
    documentViewer: {
      sidepanel: {
        snippets: Immutable.fromJS([])
      },
      uiState: Immutable.fromJS({
        reference: {sourceRange: {selection: 'selection'}},
        highlightedReference: 'highlightedReference'
      }),
      doc: Immutable.fromJS({sharedId: 'docSharedId', name: 'document'}),
      targetDoc: Immutable.fromJS({}),
      references: Immutable.fromJS([
        {_id: 'r1', entity: 'docSharedId', range: {start: 0}, reference: 'reference', hub: 'hub1'},
        {_id: 'r2', entity: 'docSharedId', reference: 'should not generate a reference, its not text based', hub: 'hub2'},
        {_id: 'r3', entity: 'id1', reference: 'should be excluded', hub: 'hub2'},
        {_id: 'r4', entity: 'id2', reference: 'should be associated', hub: 'hub1'},
        {_id: 'r5', entity: 'id3', reference: 'should also be associated', hub: 'hub1'}
      ])
    }
  };

  let render = () => {
    store = mockStore(state);
    component = shallow(<SourceDocument />, {context: {store}});
  };

  it('should map props', () => {
    render();
    let props = component.props();
    expect(props.selection).toEqual({selection: 'selection'});
    expect(props.doc.get('name')).toBe('document');
    expect(props.references.toJS()).toEqual([
      {_id: 'r1', entity: 'docSharedId', range: {start: 0}, reference: 'reference', hub: 'hub1',
       associatedRelationship: {_id: 'r4', entity: 'id2', reference: 'should be associated', hub: 'hub1'}
      },
      {_id: 'r1', entity: 'docSharedId', range: {start: 0}, reference: 'reference', hub: 'hub1',
       associatedRelationship: {_id: 'r5', entity: 'id3', reference: 'should also be associated', hub: 'hub1'}
      }
    ]);
    expect(props.className).toBe('sourceDocument');
    expect(props.executeOnClickHandler).toBe(false);
    expect(props.highlightedReference).toBe('highlightedReference');
  });

  it('should forceSimulateSelection when showing panels referencePanel or targetReferencePanel', () => {
    state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'referencePanel');
    render();
    let props = component.props();
    expect(props.forceSimulateSelection).toBe(true);

    state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'targetReferencePanel');
    render();
    props = component.props();
    expect(props.forceSimulateSelection).toBe(true);

    state.documentViewer.uiState = state.documentViewer.uiState.set('panel', 'otherPanel');
    render();
    props = component.props();
    expect(props.forceSimulateSelection).toBe(false);
  });

  it('should pass executeOnClickHandler true if target document is loaded', () => {
    state.documentViewer.targetDoc = Immutable.fromJS({_id: 'id'});
    render();

    let props = component.props();
    expect(props.executeOnClickHandler).toBe(true);
  });
});
