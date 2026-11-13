import { Dispatch, FormEvent, useEffect, useId, useReducer, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAtomValue } from 'jotai';
import { getConsent } from '#app/App/cookieConsent.js';
import { settingsAtom } from '#V2/atoms/index.js';
import { rememberReturnPath } from '#shared/authReturn.js';
import { createLoginState, loginReducer, readRemembered, type LoginAction } from './loginState.js';
import { runForgot, runLogin, runToken, type LoginAttempt } from './loginSubmit.js';

const useLoginRefs = () => {
  const identifier = useRef<HTMLInputElement>(null);
  const password = useRef<HTMLInputElement>(null);
  const token = useRef<HTMLInputElement>(null);
  const email = useRef<HTMLInputElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const identifierId = useId();
  const tokenId = useId();
  const emailId = useId();
  const messageId = useId();
  return { identifier, password, token, email, title, identifierId, tokenId, emailId, messageId };
};

const rememberArrival = (search: string, dispatch: Dispatch<LoginAction>) => {
  dispatch({ type: 'mounted' });
  const remembered = readRemembered();
  if (remembered) dispatch({ type: 'remembered', value: remembered });
  const redirect = new URLSearchParams(search).get('redirect');
  if (redirect) rememberReturnPath(redirect);
};

const stripNotice = (
  location: ReturnType<typeof useLocation>,
  navigate: ReturnType<typeof useNavigate>
) => {
  const current = new URLSearchParams(location.search);
  if (!current.has('notice')) return;
  current.delete('notice');
  const search = current.toString();
  void navigate(
    { pathname: location.pathname, search: search ? `?${search}` : '' },
    { replace: true }
  );
};

const useLoginArrival = (
  location: ReturnType<typeof useLocation>,
  navigate: ReturnType<typeof useNavigate>,
  dispatch: Dispatch<LoginAction>
) => {
  useEffect(() => {
    rememberArrival(location.search, dispatch);
    stripNotice(location, navigate);
  }, [location, navigate, dispatch]);
};

const useLoginActions = (attempt: LoginAttempt) => {
  const submitLogin = (event: FormEvent) => {
    void runLogin(event, attempt);
  };
  const submitToken = (event: FormEvent) => {
    void runToken(event, attempt);
  };
  const submitForgot = (event: FormEvent) => {
    void runForgot(event, attempt);
  };
  const showForgot = () => attempt.dispatch({ type: 'mode', mode: 'forgot' });
  const cancelForgot = () => attempt.dispatch({ type: 'mode', mode: 'login' });
  const returnToLogin = () =>
    attempt.dispatch({ type: 'mode', mode: 'login', clearPassword: true });
  return { submitLogin, submitToken, submitForgot, showForgot, cancelForgot, returnToLogin };
};

const useLoginForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const settings = useAtomValue(settingsAtom);
  const [state, dispatch] = useReducer(loginReducer, location.search, createLoginState);
  const refs = useLoginRefs();
  useLoginArrival(location, navigate, dispatch);
  useEffect(() => {
    refs.title.current?.focus();
  }, [state.mode, refs.title]);
  const acceptEssential =
    state.mounted && Boolean(settings.cookiepolicy) && getConsent() === 'rejected';
  const actions = useLoginActions({ state, dispatch, refs, acceptEssential });
  return { state, dispatch, refs, settings, actions, showCookieNote: acceptEssential };
};

export { useLoginForm };
