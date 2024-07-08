import React, { useEffect, useState } from 'react';
import { LoaderFunction, useBlocker, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useSetAtom } from 'jotai';
import { FetchResponseError } from 'shared/JSONRequest';
import { ClientSettings } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import * as settingsAPI from 'V2/api/settings';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, Tabs } from 'app/V2/Components/UI';
import { CodeEditor } from 'app/V2/Components/CodeEditor';
import { ConfirmNavigationModal } from 'V2/Components/Forms';
import { notificationAtom } from 'app/V2/atoms';

type LoaderResponse = Pick<ClientSettings, 'allowcustomJS' | 'customCSS' | 'customJS'>;

const customisationLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<LoaderResponse> =>
  async () => {
    const { allowcustomJS, customCSS, customJS } = await settingsAPI.get(headers);
    return { allowcustomJS, customCSS, customJS };
  };

const Customisation = () => {
  const { allowcustomJS, customCSS, customJS } = useLoaderData() as LoaderResponse;
  const [newCSS, setNewCSS] = useState<string | undefined>(undefined);
  const [newJS, setNewJS] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const blocker = useBlocker(hasChanges);
  const setNotifications = useSetAtom(notificationAtom);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker]);

  const handleSave = async () => {
    if (newCSS || newJS) {
      const response = await settingsAPI.save({ customCSS: newCSS, customJS: newJS });

      if (response instanceof FetchResponseError) {
        setNotifications({
          type: 'error',
          text: <Translate>An error occurred</Translate>,
          details: response.message,
        });
      } else {
        setNotifications({
          type: 'success',
          text: <Translate>Saved successfully.</Translate>,
        });
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
            <Tabs unmountTabs={false}>
              <Tabs.Tab id="css" label={<Translate>Custom CSS</Translate>}>
                <CodeEditor
                  language="css"
                  intialValue={customCSS}
                  onMount={editor => {
                    editor.getModel()?.onDidChangeContent(() => {
                      setHasChanges(true);
                      setNewCSS(editor.getValue());
                    });
                  }}
                />
              </Tabs.Tab>

              <Tabs.Tab id="js" label={<Translate>Custom JS</Translate>}>
                <CodeEditor
                  language="javascript"
                  intialValue={customJS}
                  onMount={editor => {
                    editor.getModel()?.onDidChangeContent(() => {
                      setHasChanges(true);
                      setNewJS(editor.getValue());
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
                  onMount={editor => {
                    editor.getModel()?.onDidChangeContent(() => {
                      setHasChanges(true);
                      setNewCSS(editor.getValue());
                    });
                  }}
                />
              </div>
            </div>
          )}
        </SettingsContent.Body>

        <SettingsContent.Footer className="text-end">
          <Button
            styling="solid"
            color="success"
            disabled={!hasChanges}
            onClick={async () => handleSave()}
          >
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
