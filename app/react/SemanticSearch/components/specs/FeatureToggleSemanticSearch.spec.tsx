/** @format */

import Immutable from 'immutable';
import React from 'react';
import { shallow } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { Provider } from 'react-redux';
import { FeatureToggleSemanticSearch } from '../FeatureToggleSemanticSearch';

const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);

const renderComponent = (store: MockStore<object>) =>
  shallow(
    <Provider store={store}>
      <FeatureToggleSemanticSearch>
        <span>test</span>
      </FeatureToggleSemanticSearch>
    </Provider>
  )
    .dive({ context: { store } })
    .dive();

describe('SearchBar', () => {
  describe('when feature activated', () => {
    it('should render children', () => {
      const store: MockStore<object> = mockStoreCreator({
        settings: { collection: Immutable.fromJS({ features: { semanticSearch: true } }) },
      });

      const component = renderComponent(store);
      expect(component).toMatchSnapshot();
    });
  });

  describe('when feature not activated', () => {
    it('should not render anything', () => {
      const store: MockStore<object> = mockStoreCreator({
        settings: { collection: Immutable.fromJS({ features: { semanticSearch: false } }) },
      });

      const component = renderComponent(store);

      expect(component.text()).toBe('');
    });
  });
});
