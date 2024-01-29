import { Provider } from 'react-redux';
import Immutable from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';

import { ViewerComponent } from 'app/Viewer/components/ViewerComponent';
import { PDFView } from 'app/Viewer/PDFView';
import EntityView from 'app/Viewer/EntityView';
import { Loader } from 'app/components/Elements/Loader';
import { ErrorFallback } from 'app/App/ErrorHandling/ErrorFallback';

const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);
const renderComponent = (store: MockStore<object>) =>
  shallow(
    <Provider store={store}>
      <ViewerComponent />
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
        entityView: {
          entity: Immutable.fromJS({}),
          uiState: Immutable.fromJS({ tab: 'info' }),
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
        entityView: {
          entity: Immutable.fromJS({}),
          uiState: Immutable.fromJS({ tab: 'info' }),
        },
      });

      const component = renderComponent(store);
      expect(component.find(EntityView).length).toBe(1);
    });
  });

  describe('when entity is not ready', () => {
    it('should render a loader', () => {
      const store: MockStore<object> = mockStoreCreator({
        documentViewer: {
          doc: Immutable.fromJS({}),
        },
        entityView: {
          entity: Immutable.fromJS({}),
          uiState: Immutable.fromJS({ tab: 'info' }),
        },
      });

      const component = renderComponent(store);
      expect(component.find(EntityView).length).toBe(0);
      expect(component.find(Loader).length).toBe(1);
    });
  });

  describe('when entity is not found', () => {
    it('should render a 404 fallback error', () => {
      const store: MockStore<object> = mockStoreCreator({
        documentViewer: {
          doc: Immutable.fromJS({}),
        },
        entityView: {
          entity: Immutable.fromJS({}),
          uiState: Immutable.fromJS({ tab: '404' }),
        },
      });

      const component = renderComponent(store);
      expect(component.find(EntityView).length).toBe(0);
      const error = component.find(ErrorFallback).at(0);
      expect(error.props().error).toEqual({ code: 404, message: 'Not Found' });
    });
  });
});
