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
  const htmlEditor = useRef<CodeEditorInstance>();
  const JSEditor = useRef<CodeEditorInstance>();

  const {
    register,
    formState: { errors, isDirty },
    watch,
    getValues,
  } = useForm({
    defaultValues: { title: t('System', 'New page', null, false) },
    values: loaderPage,
  });

  const handleSave = () => {
    const values = getValues('title');
    const newHTML = htmlEditor.current?.getValue();
    const newJS = JSEditor.current?.getValue();

    console.log(values, newHTML, newJS);
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
                    toggleTexts={[<Translate>Enabled</Translate>, <Translate>Disabled</Translate>]}
                  />
                </div>

                <InputField
                  id="title"
                  label={<Translate>Title</Translate>}
                  {...register('title', { required: true })}
                />
                <CopyValueInput
                  value={
                    loaderPage.sharedId ? getPageUrl(loaderPage.sharedId, loaderPage.title) : ''
                  }
                  label={<Translate>URL</Translate>}
                  className="mb-4 w-full"
                  id="page-url"
                />

                {loaderPage.sharedId && (
                  <Link target="_blank" to={getPageUrl(loaderPage.sharedId, loaderPage.title)}>
                    <div className="flex gap-2 hover:font-bold hover:cursor-pointer">
                      <ArrowTopRightOnSquareIcon className="w-4" />
                      <Translate className="underline hover:text-primary-700">View page</Translate>
                    </div>
                  </Link>
                )}
              </div>
            </Tabs.Tab>

            <Tabs.Tab id="Code" label={<Translate>Code</Translate>}>
              <div className="h-full">
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
              <div className="h-full">
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
