import React, { useRef } from 'react';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { ClientSettings } from 'app/apiResponseTypes';
import { Translate } from 'app/I18N';
import * as settingsAPI from 'V2/api/settings';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, Tabs } from 'app/V2/Components/UI';
import { CodeEditor, CodeEditorInstance } from 'app/V2/Components/CodeEditor';

type LoaderResponse = Pick<ClientSettings, 'allowcustomJS' | 'customCSS' | 'customJS'>;

const customisationLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction<LoaderResponse> =>
  async () => {
    const { allowcustomJS, customCSS, customJS } = await settingsAPI.get(headers);
    return { allowcustomJS, customCSS, customJS };
  };

const Customisation = () => {
  const { allowcustomJS, customCSS, customJS } = useLoaderData() as LoaderResponse;
  const cssEditorRef = useRef<CodeEditorInstance>();
  const jsEditorRef = useRef<CodeEditorInstance>();

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
                    cssEditorRef.current = editor;
                  }}
                />
              </Tabs.Tab>

              <Tabs.Tab id="js" label={<Translate>Custom JS</Translate>}>
                <CodeEditor
                  language="javascript"
                  intialValue={customJS}
                  onMount={editor => {
                    jsEditorRef.current = editor;
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
                    cssEditorRef.current = editor;
                  }}
                />
              </div>
            </div>
          )}
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex gap-2 justify-end">
            <Button styling="light">
              <Translate>Cancel</Translate>
            </Button>
            <Button styling="solid" color="success">
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { Customisation, customisationLoader };
