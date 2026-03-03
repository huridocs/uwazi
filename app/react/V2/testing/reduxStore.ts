/* eslint-disable camelcase */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { IStore } from '#app/istore.js';

const defaultState = {
  locale: 'en',
  inlineEdit: Immutable.fromJS({ inlineEdit: false }),
  translations: Immutable.fromJS([
    {
      locale: 'en',
      contexts: [],
    },
  ]),
  settings: Immutable.fromJS({}),
  templates: Immutable.fromJS({}),
};

const middlewares = [thunk];

const LEGACY_createStore = (state?: Partial<IStore>) =>
  configureStore<object>(middlewares)(() => ({ ...defaultState, ...state }));

export { LEGACY_createStore };
