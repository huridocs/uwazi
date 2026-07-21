import React, { useEffect, useState } from 'react';
import { useRevalidator } from 'react-router';
import { Button, Card, CopyValueInput, Sidepanel } from '#V2/Components/UI/index.js';
import { t, Translate } from '#app/I18N/index.js';
import loadable from '@loadable/component';
import { InputField } from '#V2/Components/Forms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { useServices } from '#V2/services/index.js';

const QRCodeSVG = loadable(
  async () => import(/* webpackChunkName: "qrcode.react" */ 'qrcode.react'),
  {
    resolveComponent: components => components.QRCodeSVG,
  }
);

interface TwoFactorSetupProps {
  closePanel: () => void;
  isOpen?: boolean;
}

const TwoFactorSetup = ({ closePanel, isOpen }: TwoFactorSetupProps) => {
  const { users: usersService } = useServices();
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [otpauth, setOtpauth] = useState('');
  const { notify } = useRequestStatus();
  const revalidator = useRevalidator();
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    if (!isOpen || secret) return;

    const loadSecret = async () => {
      const [data, error] = await usersService.get2FASecret();

      if (error) {
        notify(
          'error',
          t('System', 'An error occurred', null, false),
          undefined,
          error.detail ?? error.message
        );
        return;
      }

      setSecret(data.secret);
      setOtpauth(data.otpauth);
    };

    loadSecret().catch(() => undefined);
  }, [isOpen, secret, usersService, notify]);

  const tokenChange = (value: string) => {
    setToken(value);
    if (tokenError) {
      setTokenError(false);
    }
  };

  const enable2fa = async () => {
    const [, error] = await usersService.enable2FA(token);

    if (error) {
      if (error.status === 409) {
        setTokenError(true);
        return;
      }

      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        error.detail ?? error.message
      );
      return;
    }

    await revalidator.revalidate();
    closePanel();
    notify('success', t('System', '2FA Enabled', null, false));
  };

  return (
    <Sidepanel
      title={<Translate className="uppercase">Two-Factor Authentication</Translate>}
      isOpen={isOpen}
      closeSidepanelFunction={closePanel}
      size="large"
      withOverlay
    >
      <Sidepanel.Body>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          <Card className="mb-4 sm:col-span-2" title={<Translate>Using Authenticator</Translate>}>
            <ol className="list-decimal list-inside">
              <li className="mb-4">
                <Translate>
                  Download a third-party authenticator app from your mobile store.
                </Translate>
                &nbsp;
                <span no-translate className="italic text-ink-muted">
                  (Google Authenticator, LastPass Authenticator, Microsoft Authenticator, Authy,
                  etc.)
                </span>
              </li>
              <li className="mb-4">
                <Translate>
                  Add an account to the app by scanning the provided QR code with your mobile device
                  or by inserting the provided key.
                </Translate>
              </li>
            </ol>
            <p>
              <Translate className="italic text-ink-muted">
                Instructions on how to achieve this will vary according to the app used, please
                refer to the app's documentation.
              </Translate>
            </p>
          </Card>
          <Card className="mb-4 sm:col-span-1" title={<Translate>QR Code</Translate>}>
            <div className="flex justify-center">
              <QRCodeSVG
                value={otpauth}
                level="Q"
                includeMargin={false}
                size={180}
                bgColor="white"
                fgColor="black"
                // @ts-ignore required for accessibility check
                title="qr code"
              />
            </div>
          </Card>
          <Card className="mb-4 sm:col-span-3" title={<Translate>Secret keys</Translate>}>
            <CopyValueInput
              value={secret}
              className="w-full mb-4"
              label={
                <>
                  <Translate className="block">
                    You can also enter this secret key into your Authenticator app.
                  </Translate>
                  <Translate className="block italic text-ink-muted">
                    *please keep this key secret and don't share it.
                  </Translate>
                </>
              }
              id="authenticator-secret"
            />
            <InputField
              onChange={e => tokenChange(e.target.value)}
              id="authenticator-token"
              label={
                <Translate className="font-bold">
                  Enter the 6-digit verification code generated by your Authenticator app
                </Translate>
              }
              name="token"
              autoComplete="off"
              value={token}
              hasErrors={tokenError}
            />
            {tokenError && (
              <p className="mt-2 text-sm text-error-600">
                <Translate>The token does not validate against the secret key</Translate>
              </p>
            )}
          </Card>
        </div>
      </Sidepanel.Body>
      <Sidepanel.Footer className="px-4 py-3">
        <div className="flex w-full gap-2">
          <Button variant="ghost" onClick={closePanel} className="grow">
            <Translate>Cancel</Translate>
          </Button>
          <Button className="grow" disabled={!token} onClick={enable2fa}>
            <Translate>Enable</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { TwoFactorSetup };
