import React from 'react';
import { mount, ReactWrapper, shallow } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { ConnectedComponent, Provider } from 'react-redux';
import thunk from 'redux-thunk';
import Immutable from 'immutable';

const middlewares = [thunk];
const mockStoreCreator: MockStoreCreator<object> = configureStore<object>(middlewares);

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
  const stateToMap = { ...defaultState, state };
  const store = mockStoreCreator(useDefaultTranslationState ? stateToMap : state);
  return mount(
    <Provider store={store}>
      <Component {...props} />
    </Provider>
  );
};

export { renderConnected, renderConnectedMount };
