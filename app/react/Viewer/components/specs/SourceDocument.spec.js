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
        {entity: 'docSharedId', reference: 'reference'},
        {entity: 'anotherId', reference: 'should be excluded'}
      ])
    }
  };

  let render = () => {
    store = mockStore(state);
    component = shallow(<SourceDocument />, {context: {store}});
  };

  fit('should map props', () => {
    render();
    let props = component.props();
    expect(props.selection).toEqual({selection: 'selection'});
    expect(props.doc.get('name')).toBe('document');
    expect(props.references).toEqual([{entity: 'docSharedId', reference: 'reference'}]);
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
