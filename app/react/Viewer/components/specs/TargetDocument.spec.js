import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';

import TargetDocument from 'app/Viewer/components/TargetDocument';
import * as viewerSelectors from '../../selectors';

describe('TargetDocument', () => {
  let component;
  let store;
  const mockStore = configureMockStore([]);

  const state = {
    documentViewer: {
      uiState: Immutable.fromJS({
        reference: { targetRange: { selection: 'selection' } },
      }),
      targetDoc: Immutable.fromJS({ name: 'document' }),
      targetDocHTML: Immutable.fromJS({ pages: 'pages', css: 'css' }),
      selectedTargetReferences: Immutable.fromJS({ keysOf: 'selectTargetReferences' }),
    },
  };

  const render = () => {
    store = mockStore(state);
    component = shallow(<TargetDocument />, { context: { store } });
  };

  it('should map props', () => {
    spyOn(viewerSelectors, 'selectTargetReferences').and.callFake(
      fnSstate => fnSstate.documentViewer.selectedTargetReferences
    );
    render();

    const props = component.props();
    expect(props.selection).toEqual({ selection: 'selection' });
    expect(props.doc.toJS().name).toBe('document');
    expect(props.docHTML.toJS()).toEqual({ pages: 'pages', css: 'css' });
    expect(props.references.toJS().keysOf).toBe('selectTargetReferences');
    expect(props.className).toBe('targetDocument');
  });
});
