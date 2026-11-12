import React from 'react';
import { Translate, t } from '#app/I18N/index.js';
import {
  INPUT,
  LABEL,
  TEXT_LINK,
  AuthHeading,
  AuthLayout,
  AuthMessage,
  AuthPasswordField,
  AuthSubmit,
} from './AuthLayout.js';
import { useLoginForm } from './useLoginForm.js';

const Login = () => {
  const { state, dispatch, refs, settings, actions, showCookieNote } = useLoginForm();

  return (
    <AuthLayout component="LoginView">
      {state.mode === 'login' && (
        <form
          data-mode="login"
          onSubmit={actions.submitLogin}
          noValidate
          aria-describedby={refs.messageId}
        >
          <AuthHeading
            titleRef={refs.title}
            eyebrow={settings.site_name}
            title={<Translate>Log in</Translate>}
            lead={<Translate>With your Uwazi username.</Translate>}
          />
          <div className="mt-8">
            <label htmlFor={refs.identifierId} className={LABEL}>
              <Translate>Username</Translate>
            </label>
            <input
              ref={refs.identifier}
              id={refs.identifierId}
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t('System', 'e.g. admin', null, false)}
              value={state.identifier}
              onChange={event => dispatch({ type: 'identifier', value: event.target.value })}
              disabled={state.pending}
              aria-invalid={state.invalid.identifier || undefined}
              aria-describedby={state.invalid.identifier ? refs.messageId : undefined}
              className={INPUT}
            />
          </div>
          <div className="mt-4">
            <AuthPasswordField
              label={<Translate>Password</Translate>}
              name="password"
              inputRef={refs.password}
              autoComplete="current-password"
              value={state.password}
              onChange={value => dispatch({ type: 'password', value })}
              disabled={state.pending}
              invalid={state.invalid.password}
              describedBy={refs.messageId}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-secondary">
              <input
                type="checkbox"
                checked={state.remember}
                onChange={event => dispatch({ type: 'remember', value: event.target.checked })}
                disabled={state.pending}
                className="h-4 w-4 rounded border-border"
              />
              <Translate>Remember me</Translate>
            </label>
            <button type="button" onClick={actions.showForgot} className={TEXT_LINK}>
              <Translate>Forgot password or username?</Translate>
            </button>
          </div>
          <AuthMessage id={refs.messageId} message={state.message} />
          <AuthSubmit
            pending={state.pending}
            label={<Translate>Log in</Translate>}
            pendingLabel={<Translate>Logging in…</Translate>}
          />
          {showCookieNote && (
            <p className="mt-3 text-center text-xs text-ink-tertiary">
              <Translate>
                By logging in you accept the essential session cookie required to stay signed in.
              </Translate>
            </p>
          )}
        </form>
      )}
      {state.mode === 'two-step' && (
        <form
          data-mode="two-step"
          onSubmit={actions.submitToken}
          noValidate
          aria-describedby={refs.messageId}
        >
          <AuthHeading
            titleRef={refs.title}
            eyebrow={settings.site_name}
            title={<Translate>Two-step verification</Translate>}
            lead={
              <Translate>Open the authenticator app on your device to see your code.</Translate>
            }
          />
          <div className="mt-8">
            <label htmlFor={refs.tokenId} className={LABEL}>
              <Translate>Authentication code</Translate>
            </label>
            <input
              ref={refs.token}
              id={refs.tokenId}
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={state.token}
              onChange={event => dispatch({ type: 'token', value: event.target.value })}
              disabled={state.pending}
              aria-invalid={state.invalid.token || undefined}
              aria-describedby={state.invalid.token ? refs.messageId : undefined}
              className={`${INPUT} font-mono tracking-[0.3em]`}
            />
          </div>
          <AuthMessage id={refs.messageId} message={state.message} />
          <AuthSubmit
            pending={state.pending}
            label={<Translate>Verify</Translate>}
            pendingLabel={<Translate>Verifying…</Translate>}
          />
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={actions.returnToLogin} className={TEXT_LINK}>
              <Translate>Return to login</Translate>
            </button>
          </div>
        </form>
      )}
      {state.mode === 'forgot' && (
        <form
          data-mode="forgot"
          onSubmit={actions.submitForgot}
          noValidate
          aria-describedby={refs.messageId}
        >
          <AuthHeading
            titleRef={refs.title}
            eyebrow={settings.site_name}
            title={<Translate>Forgot your password?</Translate>}
            lead={
              <Translate>
                If an account exists with the email you provide, you will receive an email with your
                username and a link to reset your password.
              </Translate>
            }
          />
          <div className="mt-8">
            <label htmlFor={refs.emailId} className={LABEL}>
              <Translate>Email</Translate>
            </label>
            <input
              ref={refs.email}
              id={refs.emailId}
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              value={state.email}
              onChange={event => dispatch({ type: 'email', value: event.target.value })}
              disabled={state.pending}
              aria-invalid={state.invalid.email || undefined}
              aria-describedby={state.invalid.email ? refs.messageId : undefined}
              className={INPUT}
            />
          </div>
          <AuthMessage id={refs.messageId} message={state.message} />
          <AuthSubmit
            pending={state.pending}
            label={<Translate>Send recovery email</Translate>}
            pendingLabel={<Translate>Sending…</Translate>}
          />
          <div className="mt-4 flex justify-center">
            <button type="button" onClick={actions.cancelForgot} className={TEXT_LINK}>
              <Translate>Cancel</Translate>
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export { Login };
