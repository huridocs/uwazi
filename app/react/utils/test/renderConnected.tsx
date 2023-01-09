import React from 'react';
import { mount, ReactWrapper, shallow } from 'enzyme';
import configureStore, { MockStore, MockStoreCreator } from 'redux-mock-store';
import { InitialEntry } from '@remix-run/router';
import { ConnectedComponent, Provider } from 'react-redux';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { render } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';

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
  Component: React.ComponentClass<any> | React.FC<any>,
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
  confirm: Function = () => {}
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

const renderConnectedContainer = (
  children: JSX.Element,
  stateFunc: () => {},
  routerWrapper?: 'BrowserRouter' | 'MemoryRouter',
  memoryRouterLocation: InitialEntry[] | undefined = undefined
) => {
  const store = configureStore<object>(middlewares)(stateFunc);

  let renderResult;

  switch (routerWrapper) {
    case 'BrowserRouter':
      renderResult = render(<Provider store={store}>{children}</Provider>, {
        wrapper: BrowserRouter,
      });
      break;

    case 'MemoryRouter':
      renderResult = render(
        <MemoryRouter initialEntries={memoryRouterLocation}>
          <Provider store={store}>{children}</Provider>
        </MemoryRouter>
      );
      break;

    default:
      renderResult = render(<Provider store={store}>{children}</Provider>);
      break;
  }

  return {
    renderResult,
    store,
  };
};

export { renderConnected, renderConnectedMount, renderConnectedContainer, defaultState };
