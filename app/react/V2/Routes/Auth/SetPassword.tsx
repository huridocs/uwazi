import React, { FormEvent, useEffect, useId, useReducer, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import {
  TEXT_LINK,
  AuthHeading,
  AuthLayout,
  AuthMessage,
  AuthPasswordField,
  AuthSubmit,
} from './AuthLayout.js';
import { initialSetPassword, savePassword, setPasswordReducer } from './setPasswordFlow.js';

const useSetPasswordForm = () => {
  const [state, dispatch] = useReducer(setPasswordReducer, initialSetPassword);
  const firstRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const messageId = useId();
  useEffect(() => {
    if (state.expired) titleRef.current?.focus();
  }, [state.expired]);
  return { state, dispatch, firstRef, titleRef, messageId };
};

const SetPassword = () => {
  const { key = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const settings = useAtomValue(settingsAtom);
  const form = useSetPasswordForm();
  const createAccount = searchParams.get('createAccount') === 'true';
  const submit = (event: FormEvent) => {
    void savePassword(event, {
      key,
      state: form.state,
      createAccount,
      navigate,
      dispatch: form.dispatch,
      firstRef: form.firstRef,
    });
  };

  if (form.state.expired) {
    return (
      <AuthLayout component="SetPasswordView">
        <div data-part="expired">
          <AuthHeading
            titleRef={form.titleRef}
            eyebrow={settings.site_name}
            title={<Translate>This link no longer works</Translate>}
            lead={
              <Translate>
                Links to set a password are valid for 24 hours and work once. Ask for a new one with
                the email of your account.
              </Translate>
            }
          />
          <button
            type="button"
            data-part="request-new"
            onClick={() => {
              void navigate('/login?mode=forgot');
            }}
            className="mt-8 flex h-10 w-full cursor-pointer items-center justify-center rounded-md border border-ink bg-ink text-sm font-medium text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-carbon/50 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            <Translate>Request a new link</Translate>
          </button>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                void navigate('/login');
              }}
              className={TEXT_LINK}
            >
              <Translate>Back to log in</Translate>
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout component="SetPasswordView">
      <form onSubmit={submit} noValidate aria-describedby={form.messageId}>
        <AuthHeading
          titleRef={form.titleRef}
          eyebrow={settings.site_name}
          title={
            createAccount ? (
              <Translate>Create your password</Translate>
            ) : (
              <Translate>Set a new password</Translate>
            )
          }
        />
        {createAccount && (
          <p className="mt-4 flex items-start gap-2 rounded-md bg-carbon/10 px-3 py-2.5 text-sm text-ink">
            <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-carbon" aria-hidden />
            <Translate>
              To complete the account creation process, please create a password for your account.
            </Translate>
          </p>
        )}
        <div className="mt-8">
          <AuthPasswordField
            label={<Translate>Password</Translate>}
            name="password"
            inputRef={form.firstRef}
            autoComplete="new-password"
            value={form.state.password}
            onChange={value => form.dispatch({ type: 'password', value })}
            disabled={form.state.pending}
            invalid={form.state.mismatch}
            describedBy={form.messageId}
          />
        </div>
        <div className="mt-4">
          <AuthPasswordField
            label={<Translate>Repeat password</Translate>}
            name="repeat-password"
            autoComplete="new-password"
            value={form.state.repeat}
            onChange={value => form.dispatch({ type: 'repeat', value })}
            disabled={form.state.pending}
            invalid={form.state.mismatch}
            describedBy={form.messageId}
          />
        </div>
        <AuthMessage id={form.messageId} message={form.state.message} />
        <AuthSubmit
          pending={form.state.pending}
          label={<Translate>Save password</Translate>}
          pendingLabel={<Translate>Saving…</Translate>}
        />
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => {
              void navigate('/login');
            }}
            className={TEXT_LINK}
          >
            <Translate>Back to log in</Translate>
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export { SetPassword };
