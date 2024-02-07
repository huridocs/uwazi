/* eslint-disable react/jsx-props-no-spreading */
import React, { useRef } from 'react';
import { IncomingHttpHeaders } from 'http';
import { Link, LoaderFunction, useLoaderData } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Translate, t } from 'app/I18N';
import * as pagesAPI from 'V2/api/pages';
import { Page } from 'V2/shared/types';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, CopyValueInput, Tabs } from 'V2/Components/UI';
import { CodeEditor, CodeEditorInstance } from 'V2/Components/CodeEditor';
import { EnableButtonCheckbox, InputField } from 'app/V2/Components/Forms';
import { getPageUrl } from './components/PageListTable';
import { HTMLNotification, JSNotification } from './components/PageEditorComponents';

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
  const page = useLoaderData() as Page;
  const htmlEditor = useRef<CodeEditorInstance>();
  const JSEditor = useRef<CodeEditorInstance>();

  const {
    register,
    formState: { errors, isDirty },
    watch,
    getValues,
  } = useForm({
    defaultValues: { title: t('System', 'New page', null, false) },
    values: page,
  });

  const handleSave = () => {
    const values = getValues();
    const newHTML = htmlEditor.current?.getValue();
    const newJS = JSEditor.current?.getValue();

    const updatedPage: Page = {
      ...page,
      ...values,
      metadata: { content: newHTML, script: newJS },
    };

    console.log(updatedPage);
  };

  const handleCancel = () => {};

  const handleSaveAndPreview = () => {};

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Pages', '/settings/pages']])}
          title={watch('title')}
        />

        <SettingsContent.Body>
          <Tabs unmountTabs={false}>
            <Tabs.Tab id="Basic" label={<Translate>Basic</Translate>}>
              <div className="flex flex-col gap-4 max-w-2xl">
                <div className="flex gap-4 items-center">
                  <Translate className="font-bold">
                    Enable this page to be used as an entity view page:
                  </Translate>
                  <EnableButtonCheckbox
                    {...register('entityView')}
                    defaultChecked={page.entityView}
                  />
                </div>

                <InputField
                  id="title"
                  label={<Translate>Title</Translate>}
                  {...register('title', { required: true })}
                />
                <CopyValueInput
                  value={page.sharedId ? getPageUrl(page.sharedId, page.title) : ''}
                  label={<Translate>URL</Translate>}
                  className="mb-4 w-full"
                  id="page-url"
                />

                {page.sharedId && (
                  <Link target="_blank" to={getPageUrl(page.sharedId, page.title)}>
                    <div className="flex gap-2 hover:font-bold hover:cursor-pointer">
                      <ArrowTopRightOnSquareIcon className="w-4" />
                      <Translate className="underline hover:text-primary-700">View page</Translate>
                    </div>
                  </Link>
                )}
              </div>
            </Tabs.Tab>

            <Tabs.Tab id="Code" label={<Translate>Code</Translate>}>
              <div className="flex flex-col gap-2 h-full">
                <HTMLNotification />
                <CodeEditor
                  language="html"
                  code={getValues('metadata.content')}
                  getEditor={editor => {
                    htmlEditor.current = editor;
                  }}
                />
                <textarea {...register('metadata.content')} className="hidden" />
              </div>
            </Tabs.Tab>

            <Tabs.Tab id="Advanced" label={<Translate>Advanced</Translate>}>
              <div className="flex flex-col gap-2 h-full">
                <JSNotification />
                <CodeEditor
                  language="javascript"
                  code={getValues('metadata.script')}
                  getEditor={editor => {
                    JSEditor.current = editor;
                  }}
                />
                <textarea {...register('metadata.script')} className="hidden" />
              </div>
            </Tabs.Tab>
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex gap-2 justify-end">
            <Button styling="light" onClick={() => {}}>
              <Translate>Cancel</Translate>
            </Button>

            <Button styling="solid" color="primary" onClick={() => handleSave()}>
              <Translate>Save & Preview</Translate>
            </Button>

            <Button styling="solid" color="success" onClick={() => handleSave()}>
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { PageEditor, pageEditorLoader };
