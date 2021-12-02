import React from 'react';
import { Provider } from 'react-redux';
import Immutable from 'immutable';
import { shallow } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';

import { FeatureToggle, OwnPropTypes } from '../FeatureToggle';

const mockStoreCreator: MockStoreCreator<object> = configureStore<object>([]);

const renderComponent = (store: MockStore<object>, feature: string = 'testFeature') => {
  const ownProps: OwnPropTypes = { feature };

  return shallow(
    <Provider store={store}>
      <FeatureToggle {...ownProps}>
        <span>test</span>
      </FeatureToggle>
    </Provider>
  )
    .dive({ context: { store } })
    .dive();
};

describe('FeatureToggle', () => {
  let store: MockStore<object>;

  beforeEach(() => {
    store = mockStoreCreator({
      settings: {
        collection: Immutable.fromJS({
          features: { disabledFeature: false, activatedFeature: true },
        }),
      },
    });
  });

  describe('when feature activated', () => {
    it('should render children', () => {
      const component = renderComponent(store, 'activatedFeature');
      expect(component).toMatchSnapshot();
    });
  });

  describe('when feature not activated', () => {
    it('should not render anything', () => {
      const component = renderComponent(store, 'disabledFeature');
      expect(component.text()).toBe('');
    });
  });

  it('should not fail if features not present', () => {
    store = mockStoreCreator({
      settings: { collection: Immutable.fromJS({}) },
    });

    const component = renderComponent(store, 'activatedFeature');
    expect(component).toMatchSnapshot();
  });

  it('should work with string paths', () => {
    store = mockStoreCreator({
      settings: {
        collection: Immutable.fromJS({
          features: { featureGroup: { enabled: true } },
        }),
      },
    });

    const component = renderComponent(store, 'featureGroup.enabled');
    expect(component.find('span').text()).toEqual('test');
  });
});
