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
    documentViewer: {
      uiState: Immutable.fromJS({
        reference: {sourceRange: {selection: 'selection'}},
        highlightedReference: 'highlightedReference'
      }),
      doc: {name: 'document'},
      docHTML: {name: 'html'},
      targetDoc: Immutable.fromJS({}),
      references: Immutable.fromJS([{reference: 'reference'}])
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
    expect(props.doc.name).toBe('document');
    expect(props.docHTML.name).toBe('html');
    expect(props.references).toEqual([{reference: 'reference'}]);
    expect(props.className).toBe('sourceDocument');
    expect(props.executeOnClickHandler).toBe(false);
    expect(props.highlightedReference).toBe('highlightedReference');
  });

  it('should pass executeOnClickHandler true if target document is loaded', () => {
    state.documentViewer.targetDoc = Immutable.fromJS({_id: 'id'});
    render();

    let props = component.props();
    expect(props.executeOnClickHandler).toBe(true);
  });
});
