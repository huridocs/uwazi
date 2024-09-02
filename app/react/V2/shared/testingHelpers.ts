/* eslint-disable camelcase */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { createStore } from 'jotai';
import { fromJS } from 'immutable';
import { merge } from 'lodash';
import createMockStore from 'redux-mock-store';
import { IStore } from 'app/istore';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from '../atoms';

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

const defaultAtomsState: { settings: ClientSettings } = {
  settings: { dateFormat: 'dd-mm-yyyy' },
};

const atomsGlobalState = (initialState: { settings?: ClientSettings } = {}) => {
  const myStore = createStore();
  const values = merge(defaultAtomsState, initialState);
  myStore.set(settingsAtom, values.settings);
  return myStore;
};

const reduxStore = createMockStore([thunk])(() => ({
  locale: 'en',
  inlineEdit: fromJS({ inlineEdit: true }),
  translations: fromJS([
    {
      locale: 'en',
      contexts: [],
    },
  ]),
}));

export { LEGACY_createStore, atomsGlobalState, reduxStore };
