import React, { useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import { LoaderFunction, useLoaderData } from 'react-router-dom';
import { Translate, t } from 'app/I18N';
import * as pagesAPI from 'V2/api/pages';
import { Page } from 'V2/shared/types';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, Tabs, CodeEditor } from 'V2/Components/UI';

const pageEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    if (params.sharedId) {
      const page = await pagesAPI.getBySharedId(params.sharedId, params.lang || 'en', headers);

      return page;
    }

    return {};
  };

const PageEditor = () => {
  const loaderPage = useLoaderData() as Page;
  const [page, setPage] = useState<Page>(
    loaderPage._id ? loaderPage : { title: t('System', 'New page', null, false) }
  );

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Translations', '/settings/translations']])}
          title={page.title}
        />

        <SettingsContent.Body>
          <Tabs unmountTabs={false}>
            <Tabs.Tab id="Basic" label={<Translate>Basic</Translate>}>
              <h1>Page form</h1>
            </Tabs.Tab>

            <Tabs.Tab id="Code" label={<Translate>Code</Translate>}>
              <div className="overflow-y-auto w-full h-96">
                <CodeEditor language="html" code={page.metadata?.content} />
              </div>
            </Tabs.Tab>

            <Tabs.Tab id="Advanced" label={<Translate>Advanced</Translate>}>
              <div className="overflow-y-auto w-full h-96">
                <CodeEditor language="javascript" code={page.metadata?.script} />
              </div>
            </Tabs.Tab>
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex gap-2 justify-end">
            <Button styling="light" onClick={() => {}}>
              <Translate>Cancel</Translate>
            </Button>

            <Button styling="solid" color="primary" onClick={() => {}}>
              <Translate>Save & Preview</Translate>
            </Button>

            <Button styling="solid" color="success" onClick={() => {}}>
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { PageEditor, pageEditorLoader };
