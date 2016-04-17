
import configureMockStore from 'redux-mock-store';
import Immutable from 'immutable';
import React from 'react';
import {shallow} from 'enzyme';

import TargetDocument from 'app/Viewer/components/TargetDocument';

describe('TargetDocument', function () {
  let component;
  let store;
  const mockStore = configureMockStore([]);

  let state = {
    documentViewer: {
      uiState: Immutable.fromJS({
        reference: {targetRange: {selection: 'selection'}}
      }),
      targetDocument: {name: 'document'}
    }
  };

  let render = () => {
    store = mockStore(state);
    component = shallow(<TargetDocument />, {context: {store}});
  };

  it('should map props', () => {
    render();
    let props = component.props();
    expect(props.selection).toEqual({selection: 'selection'});
    expect(props.document.name).toBe('document');
    expect(props.references).toEqual([]);
    expect(props.className).toBe('targetDocument');
  });
});
