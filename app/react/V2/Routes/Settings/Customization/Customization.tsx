import React, { useEffect, useState } from 'react';
import { LoaderFunction, useBlocker, useLoaderData } from 'react-router';
import { IncomingHttpHeaders } from 'http';
import { ClientSettings } from '#app/apiResponseTypes.js';
import { t, Translate } from '#app/I18N/index.js';
import * as settingsAPI from '#V2/api/settings/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, Tabs, ConfirmNavigationModal } from '#V2/Components/UI/index.js';
import { CodeEditor } from '#V2/Components/CodeEditor/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

type LoaderResponse = Pick<ClientSettings, 'allowcustomJS' | 'customCSS' | 'customJS'>;

const customisationLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<LoaderResponse> =>
  async () => {
    const [settings] = await settingsAPI.get(headers);
    if (settings) {
      const { allowcustomJS, customCSS, customJS } = settings;
      return { allowcustomJS, customCSS, customJS };
    }
    return {};
  };

const Customisation = () => {
  const { allowcustomJS, customCSS, customJS } = useLoaderData() as LoaderResponse;
  const [cssContent, setCssContent] = useState<string | undefined>(undefined);
  const [jsContent, setJsContent] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const blocker = useBlocker(hasChanges);
  const { notify } = useRequestStatus();

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker]);

  const handleSave = async () => {
    if (hasChanges) {
      const [, error] = await settingsAPI.save({
        customCSS: cssContent,
        customJS: jsContent,
      });

      if (error) {
        notify('error', t('System', 'An error occurred', null, false), undefined, error.message);
      } else {
        notify('success', t('System', 'Saved successfully.', null, false));
        setHasChanges(false);
      }
    }
  };

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header title={allowcustomJS ? 'Global CSS & JS' : 'Global CSS'} />

        <SettingsContent.Body>
          {allowcustomJS ? (
            <Tabs
              groupId="settings-customization"
              unmountTabs={false}
              tabListClassName="md:w-2/3 w-full"
            >
              <Tabs.Tab id="css" label={<Translate>Custom CSS</Translate>}>
                <CodeEditor
                  language="css"
                  intialValue={customCSS}
                  onMount={(editor: any) => {
                    editor.getModel()?.onDidChangeContent(() => {
                      setHasChanges(true);
                      setCssContent(editor.getValue());
                    });
                  }}
                />
              </Tabs.Tab>

              <Tabs.Tab id="js" label={<Translate>Custom JS</Translate>}>
                <CodeEditor
                  language="javascript"
                  intialValue={customJS}
                  onMount={(editor: any) => {
                    editor.getModel()?.onDidChangeContent(() => {
                      setHasChanges(true);
                      setJsContent(editor.getValue());
                    });
                  }}
                />
              </Tabs.Tab>
            </Tabs>
          ) : (
            <div className="flex flex-col gap-4 pb-4 h-full">
              <Translate className="font-medium">Custom CSS</Translate>
              <div className="grow">
                <CodeEditor
                  language="css"
                  intialValue={customCSS}
                  onMount={(editor: any) => {
                    editor.getModel()?.onDidChangeContent(() => {
                      setHasChanges(true);
                      setCssContent(editor.getValue());
                    });
                  }}
                />
              </div>
            </div>
          )}
        </SettingsContent.Body>

        <SettingsContent.Footer className="text-end">
          <Button variant="success" disabled={!hasChanges} onClick={async () => handleSave()}>
            <Translate>Save</Translate>
          </Button>
        </SettingsContent.Footer>
      </SettingsContent>

      {showModal && (
        <ConfirmNavigationModal setShowModal={setShowModal} onConfirm={blocker.proceed} />
      )}
    </div>
  );
};

export { Customisation, customisationLoader };
