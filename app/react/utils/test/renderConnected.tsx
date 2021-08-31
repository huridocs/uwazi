import React from 'react';
import { mount, ReactWrapper, shallow } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator, MockStoreEnhanced } from 'redux-mock-store';
import { ConnectedComponent, Provider } from 'react-redux';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { render } from '@testing-library/react';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<object> = configureStore<object>(middlewares);

const defaultState = {
  locale: 'en',
  inlineEdit: Immutable.fromJS({ inlineEdit: true }),
  translations: Immutable.fromJS([
    {
      locale: 'en',
      contexts: [],
    },
  ]),
};

const renderConnected = (
  Component: React.ReactType,
  props: object,
  storeData: object = {
    template: {
      data: { properties: [], commonProperties: [] },
      formState: {
        fields: [],
        $form: {
          errors: {},
        },
      },
    },
  },
  confirm?: Function
) => {
  const store: MockStore = mockStoreCreator(storeData);
  return shallow(
    <Provider store={store}>
      <Component {...props} />
    </Provider>
  )
    .dive({ context: { store, confirm } })
    .dive();
};

const renderConnectedMount = (
  Component: ConnectedComponent<any, any> | ((props: any) => any),
  state: any = {},
  props: any = {},
  useDefaultTranslationState = false
): ReactWrapper<React.Component['props'], React.Component['state'], React.Component> => {
  const reduxStore = { ...defaultState, ...state };
  const store = mockStoreCreator(useDefaultTranslationState ? reduxStore : state);
  return mount(
    <Provider store={store}>
      <Component {...props} />
    </Provider>
  );
};

const renderConnectedContainer = (children: JSX.Element, stateFunc: () => {}) => {
  const store = configureStore<object>(middlewares)(stateFunc);
  return {
    renderResult: render(<Provider store={store}>{children}</Provider>),
    store,
  };
};

export { renderConnected, renderConnectedMount, renderConnectedContainer, defaultState };
