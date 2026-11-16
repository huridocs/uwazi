import { Dispatch, FormEvent, RefObject } from 'react';
import type { NavigateFunction } from 'react-router';
import { apiClient } from '#V2/api/client.js';
import { ApiError } from '#shared/apiClient/ApiError.js';
import type { AuthMessageValue, CopyCode } from './AuthCopy.js';

const QUIET = { policies: { auth: false, notification: false } };

type SetPasswordState = {
  password: string;
  repeat: string;
  mismatch: boolean;
  message: AuthMessageValue;
  pending: boolean;
  expired: boolean;
};

type SetPasswordAction =
  | { type: 'password'; value: string }
  | { type: 'repeat'; value: string }
  | { type: 'invalid'; message: AuthMessageValue }
  | { type: 'pending'; value: boolean }
  | { type: 'message'; message: AuthMessageValue }
  | { type: 'cleared' }
  | { type: 'expired' };

const initialSetPassword: SetPasswordState = {
  password: '',
  repeat: '',
  mismatch: false,
  message: null,
  pending: false,
  expired: false,
};

const applyTyping = (
  state: SetPasswordState,
  action: SetPasswordAction
): SetPasswordState | null => {
  if (action.type === 'password') return { ...state, password: action.value, mismatch: false };
  if (action.type === 'repeat') return { ...state, repeat: action.value, mismatch: false };
  if (action.type === 'pending') return { ...state, pending: action.value };
  return null;
};

const applyOutcome = (
  state: SetPasswordState,
  action: SetPasswordAction
): SetPasswordState | null => {
  if (action.type === 'invalid') return { ...state, mismatch: true, message: action.message };
  if (action.type === 'message') return { ...state, pending: false, message: action.message };
  if (action.type === 'cleared') return { ...state, password: '', repeat: '', pending: false };
  if (action.type === 'expired') {
    return { ...state, password: '', repeat: '', pending: false, expired: true };
  }
  return null;
};

const setPasswordReducer = (
  state: SetPasswordState,
  action: SetPasswordAction
): SetPasswordState => {
  const typed = applyTyping(state, action);
  if (typed) return typed;
  return applyOutcome(state, action) ?? state;
};

const isOutage = (error: ApiError) =>
  error.kind === 'network' || error.kind === 'timeout' || error.status >= 500;

const outageCode = (error: ApiError): CopyCode => {
  if (error.kind === 'network' || error.kind === 'timeout') return 'unreachable';
  return 'generic-error';
};

const rejectPassword = (
  state: SetPasswordState,
  dispatch: Dispatch<SetPasswordAction>,
  firstRef: RefObject<HTMLInputElement | null>
) => {
  const empty = !state.password.trim();
  if (!empty && state.password === state.repeat) return false;
  dispatch({
    type: 'invalid',
    message: { tone: 'error', code: empty ? 'enter-a-password' : 'passwords-mismatch' },
  });
  firstRef.current?.focus();
  return true;
};

const postReset = async (key: string, password: string) => {
  const [, error] = await apiClient.postJson('resetpassword', { key, password }, QUIET);
  return error;
};

type SaveRequest = {
  key: string;
  state: SetPasswordState;
  createAccount: boolean;
  navigate: NavigateFunction;
  dispatch: Dispatch<SetPasswordAction>;
  firstRef: RefObject<HTMLInputElement | null>;
};

const settleReset = (error: ApiError | undefined, request: SaveRequest) => {
  if (!error) {
    request.dispatch({ type: 'cleared' });
    const notice = request.createAccount ? 'account-ready' : 'password-saved';
    void request.navigate(`/login?notice=${notice}`);
    return;
  }
  if (isOutage(error)) {
    request.dispatch({ type: 'message', message: { tone: 'error', code: outageCode(error) } });
    return;
  }
  request.dispatch({ type: 'expired' });
};

const savePassword = async (event: FormEvent, request: SaveRequest) => {
  event.preventDefault();
  if (request.state.pending) return;
  if (rejectPassword(request.state, request.dispatch, request.firstRef)) return;
  request.dispatch({ type: 'pending', value: true });
  const error = await postReset(request.key, request.state.password);
  settleReset(error, request);
};

export { initialSetPassword, savePassword, setPasswordReducer };
export type { SetPasswordAction, SetPasswordState };
