import { AnyAction } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { IStore } from './istore.js';

export type AppDispatch = ThunkDispatch<IStore, unknown, AnyAction>;
