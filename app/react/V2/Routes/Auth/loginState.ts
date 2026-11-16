import { noticeMessage, type AuthMessageValue } from './AuthCopy.js';

type Mode = 'login' | 'two-step' | 'forgot';

type FieldInvalid = {
  identifier?: boolean;
  password?: boolean;
  token?: boolean;
  email?: boolean;
};

type LoginState = {
  mode: Mode;
  identifier: string;
  password: string;
  token: string;
  email: string;
  remember: boolean;
  pending: boolean;
  invalid: FieldInvalid;
  message: AuthMessageValue;
  mounted: boolean;
};

type LoginAction =
  | { type: 'mounted' }
  | { type: 'remembered'; value: string }
  | { type: 'identifier'; value: string }
  | { type: 'password'; value: string }
  | { type: 'token'; value: string }
  | { type: 'email'; value: string }
  | { type: 'remember'; value: boolean }
  | { type: 'pending'; value: boolean }
  | { type: 'clear' }
  | { type: 'message'; message: AuthMessageValue }
  | { type: 'invalid'; invalid: FieldInvalid; message: AuthMessageValue; clearToken?: boolean }
  | { type: 'mode'; mode: Mode; message?: AuthMessageValue; clearPassword?: boolean };

const REMEMBER_KEY = 'uwazi:loginRemember';

const readRemembered = (): string => {
  try {
    return localStorage.getItem(REMEMBER_KEY) ?? '';
  } catch {
    return '';
  }
};

const createLoginState = (search: string): LoginState => {
  const params = new URLSearchParams(search);
  return {
    mode: params.get('mode') === 'forgot' ? 'forgot' : 'login',
    identifier: '',
    password: '',
    token: '',
    email: '',
    remember: false,
    pending: false,
    invalid: {},
    message: noticeMessage(params.get('notice')),
    mounted: false,
  };
};

const applyFlags = (state: LoginState, action: LoginAction): LoginState | null => {
  if (action.type === 'mounted') return { ...state, mounted: true };
  if (action.type === 'remembered') return { ...state, identifier: action.value, remember: true };
  if (action.type === 'remember') return { ...state, remember: action.value };
  if (action.type === 'pending') return { ...state, pending: action.value };
  return null;
};

const applyMessages = (state: LoginState, action: LoginAction): LoginState | null => {
  if (action.type === 'clear') return { ...state, invalid: {}, message: null };
  if (action.type === 'message') return { ...state, pending: false, message: action.message };
  if (action.type === 'invalid') {
    return {
      ...state,
      pending: false,
      invalid: action.invalid,
      message: action.message,
      token: action.clearToken ? '' : state.token,
    };
  }
  return null;
};

const applyMode = (
  state: LoginState,
  action: Extract<LoginAction, { type: 'mode' }>
): LoginState => ({
  ...state,
  mode: action.mode,
  pending: false,
  invalid: {},
  message: action.message ?? null,
  token: '',
  password: action.clearPassword ? '' : state.password,
});

const applyField = (state: LoginState, action: LoginAction): LoginState => {
  if (action.type === 'identifier') {
    return { ...state, identifier: action.value, invalid: { ...state.invalid, identifier: false } };
  }
  if (action.type === 'password') {
    return { ...state, password: action.value, invalid: { ...state.invalid, password: false } };
  }
  if (action.type === 'token') {
    return { ...state, token: action.value.replace(/\D/g, '').slice(0, 6), invalid: {} };
  }
  if (action.type === 'email') return { ...state, email: action.value, invalid: {} };
  return state;
};

const loginReducer = (state: LoginState, action: LoginAction): LoginState => {
  const flagged = applyFlags(state, action);
  if (flagged) return flagged;
  const messaged = applyMessages(state, action);
  if (messaged) return messaged;
  if (action.type === 'mode') return applyMode(state, action);
  return applyField(state, action);
};

export { REMEMBER_KEY, createLoginState, loginReducer, readRemembered };
export type { LoginAction, LoginState };
