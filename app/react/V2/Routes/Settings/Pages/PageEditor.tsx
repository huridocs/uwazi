/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useState } from 'react';
import { IncomingHttpHeaders } from 'http';
import {
  Link,
  LoaderFunction,
  useBlocker,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from 'react-router';
import { useForm } from 'react-hook-form';
import _ from 'lodash';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Translate, t } from '#app/I18N/index.js';
import * as pagesAPI from '#V2/api/pages/index.js';
import { Page } from '#V2/shared/types.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, CopyValueInput, Tabs, ConfirmNavigationModal } from '#V2/Components/UI/index.js';
import { CodeEditor } from '#V2/Components/CodeEditor/index.js';
import { EnableButtonCheckbox, InputField } from '#app/V2/Components/Forms/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { getPageUrl } from './components/PageListTable.js';
import {
  HTMLNotification,
  JSNotification,
  MarkdownDeprecationBanner,
} from './components/PageEditorComponents.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

const pageEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    if (params.sharedId) {
      const page = await pagesAPI.getBySharedId(params.sharedId, headers);

      return page;
    }

    return {};
  };

const PageEditor = () => {
  const page = useLoaderData() as Page;
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const { notify } = useRequestStatus();

  const formValues: Page = useMemo(() => {
    const p = page as Page;
    const isNew = !p.sharedId;
    return {
      ...p,
      title: p.title ?? t('System', 'New page', null, false),
      metadata: {
        content: '',
        script: '',
        css: '',
        ...p.metadata,
      },
      version: isNew ? 2 : p.version,
    };
  }, [page]);

  const debouncedChangeHandler = useMemo(
    () => (handler: () => void) => _.debounce(handler, 500),
    []
  );

  const {
    register,
    formState: { errors, dirtyFields, isSubmitting },
    watch,
    getValues,
    setValue,
    handleSubmit,
  } = useForm({
    values: formValues,
  });

  const rawVersion = watch('version');
  const versionNum = (() => {
    if (rawVersion === undefined || rawVersion === null) {
      return undefined;
    }
    const n = Number(rawVersion);
    return Number.isNaN(n) ? undefined : n;
  })();
  const useLegacyMarkdown = versionNum == null || Number.isNaN(versionNum) || versionNum < 2;
  const showMarkdownDeprecation = !!watch('sharedId') && useLegacyMarkdown;
  const isDirty = !!Object.keys(dirtyFields).length;
  const blocker = useBlocker(isDirty && !isSubmitting);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowConfirmationModal(true);
    }
  }, [blocker, setShowConfirmationModal]);

  const handleSaveNotification = (response: Page | FetchResponseError) => {
    const hasErrors = response instanceof FetchResponseError;
    if (hasErrors) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        (response as FetchResponseError).message
      );
    } else {
      notify('success', t('System', 'Saved successfully.', null, false));
    }
  };

  const handleRevalidate = async (response: Page) => {
    if (!page.sharedId) {
      await navigate(`/${response.language}/settings/pages/edit/${response.sharedId}`, {
        replace: true,
      });
    } else {
      await revalidator.revalidate();
    }
  };

  const buildSavePayload = (data: Page): Page => {
    const payload: Page = { ...data };
    if (!payload.sharedId) {
      payload.version = 2;
    } else if (
      payload.version === undefined ||
      payload.version === null ||
      Number.isNaN(Number(payload.version))
    ) {
      delete (payload as { version?: number }).version;
    } else {
      const n = Number(payload.version);
      if (!Number.isNaN(n)) {
        payload.version = n;
      } else {
        delete (payload as { version?: number }).version;
      }
    }
    return payload;
  };

  const save = async (data: Page) => {
    const response = await pagesAPI.save(buildSavePayload(data));

    return response;
  };

  const handleSave = async (data: Page) => {
    const response = await save(data);
    const hasErrors = response instanceof FetchResponseError;

    handleSaveNotification(response);

    if (!hasErrors) {
      await handleRevalidate(response);
    }
  };

  const handleSaveAndPreview = async (data: Page) => {
    const response = await save(data);
    const hasErrors = response instanceof FetchResponseError;

    handleSaveNotification(response);

    if (!hasErrors) {
      const pageUrl = getPageUrl(response.sharedId!, response.title);
      window.open(`${window.location.origin}/${pageUrl}`);
      await handleRevalidate(response);
    }
  };

  return (
    <div className="tw-content" style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Pages', '/settings/pages']])}
          title={watch('title')}
        />

        <SettingsContent.Body>
          <Tabs unmountTabs={false} tabListClassName="md:w-2/3 w-full">
            <Tabs.Tab id="Config" label={<Translate>Config</Translate>}>
              <form>
                <input className="hidden" {...register('sharedId')} />
                <div className="flex flex-col max-w-2xl gap-4">
                  {showMarkdownDeprecation && (
                    <MarkdownDeprecationBanner
                      onUpgrade={() => setValue('version', 2, { shouldDirty: true })}
                    />
                  )}
                  <div className="flex items-center gap-4">
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
                    hasErrors={errors.title !== undefined}
                    errorMessage={errors.title && <Translate>This field is required</Translate>}
                  />

                  <CopyValueInput
                    value={
                      !getValues('entityView') && getValues('sharedId')
                        ? `/${getPageUrl(getValues('sharedId')!, getValues('title'))}`
                        : ''
                    }
                    label={<Translate>URL</Translate>}
                    className="w-full mb-4"
                    id="page-url"
                  />

                  {getValues('sharedId') && !getValues('entityView') && (
                    <Link
                      target="_blank"
                      to={`/${getPageUrl(getValues('sharedId')!, getValues('title'))}`}
                    >
                      <div className="flex gap-2 hover:font-bold hover:cursor-pointer">
                        <ArrowTopRightOnSquareIcon className="w-4" />
                        <Translate className="underline hover:text-primary-700">
                          View page
                        </Translate>
                      </div>
                    </Link>
                  )}
                </div>
              </form>
            </Tabs.Tab>

            <Tabs.Tab id="HTML" key="html" label={<Translate>HTML</Translate>}>
              <div className="flex flex-col h-full gap-2">
                <HTMLNotification useLegacyMarkdown={useLegacyMarkdown} />
                <div className="h-full pt-2">
                  <CodeEditor
                    language="html"
                    intialValue={page.metadata?.content}
                    onMount={(editor: any) => {
                      editor.getModel()?.onDidChangeContent(
                        debouncedChangeHandler(() => {
                          setValue('metadata.content', editor.getValue(), { shouldDirty: true });
                        })
                      );
                    }}
                    fallbackElement={
                      <textarea {...register('metadata.content')} className="w-full h-full" />
                    }
                  />
                </div>
              </div>
            </Tabs.Tab>

            <Tabs.Tab id="Javascript" label={<Translate>Javascript</Translate>}>
              <div className="flex flex-col h-full gap-2">
                <JSNotification />
                <div className="h-full pt-2">
                  <CodeEditor
                    language="javascript"
                    intialValue={page.metadata?.script}
                    onMount={(editor: any) => {
                      editor.getModel()?.onDidChangeContent(
                        debouncedChangeHandler(() => {
                          setValue('metadata.script', editor.getValue(), { shouldDirty: true });
                        })
                      );
                    }}
                    fallbackElement={
                      <textarea {...register('metadata.script')} className="w-full h-full" />
                    }
                  />
                </div>
              </div>
            </Tabs.Tab>

            <Tabs.Tab id="CSS" label={<Translate>CSS</Translate>}>
              <div className="flex flex-col h-full gap-2">
                <div className="h-full pt-2">
                  <CodeEditor
                    language="css"
                    intialValue={page.metadata?.css}
                    onMount={(editor: any) => {
                      editor.getModel()?.onDidChangeContent(
                        debouncedChangeHandler(() => {
                          setValue('metadata.css', editor.getValue(), { shouldDirty: true });
                        })
                      );
                    }}
                    fallbackElement={
                      <textarea {...register('metadata.css')} className="w-full h-full" />
                    }
                  />
                </div>
              </div>
            </Tabs.Tab>
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex justify-end gap-2">
            <Link to="/settings/pages">
              <Button variant="ghost" disabled={isSubmitting}>
                <Translate>Cancel</Translate>
              </Button>
            </Link>

            <Button
              variant="primary"
              onClick={handleSubmit(handleSaveAndPreview)}
              disabled={getValues('entityView') || isSubmitting}
            >
              <Translate>Save & Preview</Translate>
            </Button>

            <Button variant="success" onClick={handleSubmit(handleSave)} disabled={isSubmitting}>
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>

      {showConfirmationModal && (
        <ConfirmNavigationModal
          setShowModal={setShowConfirmationModal}
          onConfirm={blocker.proceed}
        />
      )}
    </div>
  );
};

export { PageEditor, pageEditorLoader };
