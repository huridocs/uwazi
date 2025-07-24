import React, { FormEvent, useEffect, useState } from 'react';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Translate } from 'app/I18N';
import { PreserveIcon } from 'app/Layout/PreserveIcon';
import { useAtomValue } from 'jotai';
import { settingsAtom, userAtom } from 'V2/atoms';
import { Button, Card, CopyValueInput } from 'app/V2/Components/UI';
import { requestToken } from 'V2/api/preserve';

const Preserve = () => {
  const settings = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const [token, setToken] = useState('');

  const handleRequest = async (e: FormEvent) => {
    e.preventDefault();
    const result = await requestToken();
    setToken(result);
  };

  useEffect(() => {
    const { preserve } = settings.features || {};
    const userConfigs = preserve?.config?.find((conf: any) => conf?.user?._id === user?._id);
    if (userConfigs) {
      const savedToken = userConfigs.token;
      setToken(savedToken);
    }
  }, [settings, user]);

  return (
    <div className="w-full min-h-screen bg-gray-50 flex flex-col">
      <SettingsContent>
        <SettingsContent.Header title="Preserve Extension" />
        <SettingsContent.Body>
          <Card
            title={
              <div className="flex items-center gap-2">
                <Translate>Preserve Extension</Translate>
                <PreserveIcon color="#D20D6C" />
              </div>
            }
          >
            <div className="flex flex-col gap-4">
              <div>
                <span>1. </span>
                <a
                  href="https://uwazi.io/page/9852italrtk/support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-700 font-semibold hover:text-primary-800 mt-2 inline"
                >
                  <Translate>Install the browser extension.</Translate>
                </a>
              </div>
              <div>
                <span>2. </span>
                <Translate translationKey="Preserve Setup Description">
                  Request and copy the Extension Token bellow and paste it into the preserve
                  extension settings.
                </Translate>
              </div>
            </div>
            <hr className="my-2 border-gray-200" />
            <div className="flex flex-col gap-4">
              <div className="font-semibold text-gray-700 mb-2">
                <Translate>Configuration</Translate>
              </div>
              <div className="flex flex-col gap-1">
                <CopyValueInput
                  value={token}
                  label={<Translate>Extension Token</Translate>}
                  id="extension-token"
                />
              </div>
              <div className="flex justify-end">
                {!token && (
                  <Button onClick={handleRequest}>
                    <Translate>Request token</Translate>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export { Preserve };
