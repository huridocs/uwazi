import { Provider } from 'react-redux';
import Immutable from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';

import ViewerComponent from 'app/Viewer/components/ViewerComponent';
import PDFView from 'app/Viewer/PDFView';
import EntityView from 'app/Viewer/EntityView';

const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);
const renderComponent = (store: MockStore<object>) =>
  shallow(
    <Provider store={store}>
      <ViewerComponent location={{}} />
    </Provider>
  )
    .dive({ context: { store } })
    .dive();

describe('ViewerComponent', () => {
  const entity = { _id: 'id', sharedId: 'sharedId', documents: [{ _id: 'docId' }], defaultDoc: {} };

  describe('when there is defaultDoc on the entity', () => {
    it('should render PDFView and pass down default document', () => {
      const store: MockStore<object> = mockStoreCreator({
        documentViewer: {
          doc: Immutable.fromJS(entity),
        },
      });

      const component = renderComponent(store);
      expect(component.find(PDFView).length).toBe(1);
    });
  });

  describe('when there is no defaultDoc on the entity', () => {
    it('should render entityView', () => {
      const store: MockStore<object> = mockStoreCreator({
        documentViewer: {
          doc: Immutable.fromJS({ ...entity, defaultDoc: null }),
        },
      });

      const component = renderComponent(store);
      expect(component.find(EntityView).length).toBe(1);
    });
  });
});
