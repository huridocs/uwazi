import configureMockStore from 'redux-mock-store';
import Immutable from 'Immutable';
import React from 'react';
import {shallow} from 'enzyme';

import SourceDocument from 'app/Viewer/components/sourceDocument';

describe('SourceDocument', function () {
  let component;
  let store;
  const mockStore = configureMockStore([]);

  beforeEach(() => {
    store = mockStore({
      documentViewer: {
        uiState: Immutable.fromJS({
          reference: {sourceRange: {selection: 'selection'}}
        }),
        document: {name: 'document'},
        references: Immutable.fromJS([{reference: 'reference'}])
      }
    });
    component = shallow(<SourceDocument />, {context: {store}});
  });

  it('should map props', () => {
    let props = component.props();
    expect(props.selection).toEqual({selection: 'selection'});
    expect(props.document.name).toBe('document');
    expect(props.references).toEqual([{reference: 'reference'}]);
    expect(props.className).toBe('sourceDocument');
  });
});
