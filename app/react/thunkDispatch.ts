import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { IStore } from './istore.js';

type AppDispatch = ThunkDispatch<IStore, undefined, AnyAction>;

export type { AppDispatch };
