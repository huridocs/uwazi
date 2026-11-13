import { Dispatch, FormEvent } from 'react';
import { setConsent } from '#app/App/cookieConsent.js';
import { apiClient } from '#V2/api/client.js';
import type { LoginResponse } from '#shared/contracts/Users.js';
import { ApiError } from '#shared/apiClient/ApiError.js';
import { consumeReturnPath, safeReturnPath } from '#shared/authReturn.js';
import type { CopyCode } from './AuthCopy.js';
import { REMEMBER_KEY, type LoginAction, type LoginState } from './loginState.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const QUIET = { policies: { auth: false, notification: false } };

type Focusable = { current: HTMLInputElement | null };

type LoginFocus = {
  identifier: Focusable;
  password: Focusable;
  token: Focusable;
  email: Focusable;
};

type LoginAttempt = {
  state: LoginState;
  dispatch: Dispatch<LoginAction>;
  refs: LoginFocus;
  acceptEssential: boolean;
};

const failureCode = (error: ApiError, fallback: CopyCode): CopyCode => {
  if (error.kind === 'network' || error.kind === 'timeout') return 'unreachable';
  if (error.status >= 500) return 'generic-error';
  return fallback;
};

const isOutage = (error: ApiError) =>
  error.kind === 'network' || error.kind === 'timeout' || error.status >= 500;

const storeRemembered = (remember: boolean, identifier: string) => {
  try {
    if (remember) localStorage.setItem(REMEMBER_KEY, identifier.trim());
    else localStorage.removeItem(REMEMBER_KEY);
  } catch {
    // Storage blocked.
  }
};

const finishLogin = (state: LoginState, acceptEssential: boolean) => {
  storeRemembered(state.remember, state.identifier);
  if (acceptEssential) setConsent('essential');
  const stored = consumeReturnPath();
  const fromQuery = safeReturnPath(new URLSearchParams(window.location.search).get('redirect'));
  window.location.assign(fromQuery ?? stored ?? '/');
};

const postLogin = async (username: string, password: string, token?: string) => {
  const [, error] = await apiClient.postJson<LoginResponse>(
    'login',
    { username: username.trim(), password, token },
    QUIET
  );
  return error;
};

const emptyLoginCode = (missingIdentifier: boolean, missingPassword: boolean): CopyCode => {
  if (missingIdentifier && missingPassword) return 'enter-both';
  if (missingIdentifier) return 'enter-username';
  return 'enter-password';
};

const focusField = (refs: LoginFocus, field: keyof LoginFocus) => {
  refs[field].current?.focus();
};

const rejectEmptyLogin = (attempt: LoginAttempt): boolean => {
  const missingIdentifier = !attempt.state.identifier.trim();
  const missingPassword = !attempt.state.password;
  if (!missingIdentifier && !missingPassword) return false;
  attempt.dispatch({
    type: 'invalid',
    invalid: { identifier: missingIdentifier, password: missingPassword },
    message: { tone: 'error', code: emptyLoginCode(missingIdentifier, missingPassword) },
  });
  focusField(attempt.refs, missingIdentifier ? 'identifier' : 'password');
  return true;
};

const settlePassword = (error: ApiError | undefined, attempt: LoginAttempt) => {
  attempt.dispatch({ type: 'pending', value: false });
  if (!error) {
    finishLogin(attempt.state, attempt.acceptEssential);
    return;
  }
  if (error.status === 409) {
    attempt.dispatch({ type: 'mode', mode: 'two-step' });
    return;
  }
  attempt.dispatch({
    type: 'invalid',
    invalid: { identifier: true, password: true },
    message: { tone: 'error', code: failureCode(error, 'login-failed') },
  });
  focusField(attempt.refs, 'password');
};

const runLogin = async (event: FormEvent, attempt: LoginAttempt) => {
  event.preventDefault();
  if (attempt.state.pending) return;
  if (rejectEmptyLogin(attempt)) return;
  attempt.dispatch({ type: 'clear' });
  attempt.dispatch({ type: 'pending', value: true });
  const error = await postLogin(attempt.state.identifier, attempt.state.password);
  settlePassword(error, attempt);
};

const rejectEmptyToken = (attempt: LoginAttempt) => {
  if (attempt.state.token.trim()) return false;
  attempt.dispatch({
    type: 'invalid',
    invalid: { token: true },
    message: { tone: 'error', code: 'enter-code' },
  });
  focusField(attempt.refs, 'token');
  return true;
};

const settleToken = (error: ApiError | undefined, attempt: LoginAttempt) => {
  attempt.dispatch({ type: 'pending', value: false });
  if (!error) {
    finishLogin(attempt.state, attempt.acceptEssential);
    return;
  }
  if (error.status === 401) {
    attempt.dispatch({
      type: 'mode',
      mode: 'login',
      message: { tone: 'error', code: 'login-failed' },
      clearPassword: true,
    });
    return;
  }
  attempt.dispatch({
    type: 'invalid',
    invalid: { token: true },
    message: { tone: 'error', code: failureCode(error, 'code-failed') },
    clearToken: true,
  });
  focusField(attempt.refs, 'token');
};

const runToken = async (event: FormEvent, attempt: LoginAttempt) => {
  event.preventDefault();
  if (attempt.state.pending) return;
  if (rejectEmptyToken(attempt)) return;
  attempt.dispatch({ type: 'clear' });
  attempt.dispatch({ type: 'pending', value: true });
  const error = await postLogin(
    attempt.state.identifier,
    attempt.state.password,
    attempt.state.token
  );
  settleToken(error, attempt);
};

const postRecovery = async (email: string) => {
  const [, error] = await apiClient.postJson('recoverpassword', { email: email.trim() }, QUIET);
  return error;
};

const rejectBadEmail = (attempt: LoginAttempt) => {
  if (EMAIL.test(attempt.state.email.trim())) return false;
  attempt.dispatch({
    type: 'invalid',
    invalid: { email: true },
    message: { tone: 'error', code: 'enter-email' },
  });
  focusField(attempt.refs, 'email');
  return true;
};

const settleRecovery = (error: ApiError | undefined, attempt: LoginAttempt) => {
  if (error && isOutage(error)) {
    attempt.dispatch({
      type: 'message',
      message: { tone: 'error', code: failureCode(error, 'generic-error') },
    });
    return;
  }
  attempt.dispatch({ type: 'email', value: '' });
  attempt.dispatch({
    type: 'mode',
    mode: 'login',
    message: { tone: 'note', code: 'recovery-sent' },
  });
};

const runForgot = async (event: FormEvent, attempt: LoginAttempt) => {
  event.preventDefault();
  if (attempt.state.pending) return;
  if (rejectBadEmail(attempt)) return;
  attempt.dispatch({ type: 'pending', value: true });
  const error = await postRecovery(attempt.state.email);
  settleRecovery(error, attempt);
};

export { runForgot, runLogin, runToken };
export type { LoginAttempt, LoginFocus };
