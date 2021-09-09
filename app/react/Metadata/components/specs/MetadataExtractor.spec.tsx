import React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { Provider } from 'react-redux';
import Immutable from 'immutable';

import { MetadataExtractor } from '../MetadataExtractor';

describe('MetadataExtractor', () => {
  let component: ShallowWrapper<typeof MetadataExtractor>;
  let store: MockStore<object>;
  const mockStoreCreator: MockStoreCreator<object> = configureStore<object>();

  beforeEach(() => {
    store = mockStoreCreator({
      documentViewer: {
        uiState: Immutable.fromJS({ reference: { sourceRange: { text: 'a user selected text' } } }),
      },
    });
  });

  const render = () => {
    component = shallow(
      <Provider store={store}>
        <MetadataExtractor fieldName="field" model="documentViewer.sidepanel.metadata" />
      </Provider>
    )
      .dive()
      .dive();
  };

  it('should not render if theres not a selection', () => {
    render();
    expect(component.find('.extraction-button')).toHaveLength(1);

    store = mockStoreCreator({
      documentViewer: {
        uiState: Immutable.fromJS({ reference: { sourceRange: null } }),
      },
    });

    render();
    expect(component.find('.extraction-button')).toHaveLength(0);
  });
  it('should call update store function and the react redux form change function on click', () => {
    render();
    component.find('.extraction-button').simulate('click');
    expect(store.getActions()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'documentViewer.metadataExtraction/UPDATE_IN',
        }),
        expect.objectContaining({
          type: 'rrf/change',
        }),
      ])
    );
  });
});
