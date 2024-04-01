/* eslint-disable camelcase */
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fromJS } from 'immutable';
import { IStore } from 'app/istore';
import { merge } from 'lodash';
import { MutableSnapshot } from 'recoil';
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

const defaultRecoilState: { settings: ClientSettings } = {
  settings: { dateFormat: 'dd-mm-yyyy' },
};

const recoilGlobalState =
  (initialState: { settings?: ClientSettings } = {}) =>
  ({ set }: MutableSnapshot) => {
    const defaultRecoilValues = merge(defaultRecoilState, initialState);
    set(settingsAtom, defaultRecoilValues.settings);
  };

export { LEGACY_createStore, recoilGlobalState };
