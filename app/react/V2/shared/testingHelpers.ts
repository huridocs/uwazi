/* eslint-disable camelcase */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';
import { IStore } from 'app/istore';

const defaultState = {
  locale: 'en',
  inlineEdit: fromJS({ inlineEdit: false }),
  translations: fromJS([
    {
      locale: 'en',
      contexts: [],
    },
  ]),
  settings: fromJS({}),
  templates: fromJS({}),
};

const middlewares = [thunk];

const LEGACY_createStore = (state?: Partial<IStore>) =>
  configureStore<object>(middlewares)(() => ({ ...defaultState, ...state }));

export { LEGACY_createStore };
