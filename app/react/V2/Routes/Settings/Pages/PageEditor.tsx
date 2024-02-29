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
} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import { debounce } from 'lodash';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Translate, t } from 'app/I18N';
import * as pagesAPI from 'V2/api/pages';
import { Page } from 'V2/shared/types';
import { SettingsContent } from 'V2/Components/Layouts/SettingsContent';
import { Button, CopyValueInput, Tabs } from 'V2/Components/UI';
import { CodeEditor } from 'V2/Components/CodeEditor';
import { ConfirmNavigationModal, EnableButtonCheckbox, InputField } from 'app/V2/Components/Forms';
import { notificationAtom } from 'V2/atoms';
import { FetchResponseError } from 'shared/JSONRequest';
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
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);

  const debouncedChangeHandler = useMemo(() => (handler: () => void) => debounce(handler, 500), []);

  const {
    register,
    formState: { errors, dirtyFields, isSubmitting },
    watch,
    getValues,
    setValue,
    handleSubmit,
  } = useForm({
    defaultValues: { title: t('System', 'New page', null, false) },
    values: page,
  });

  const isDirty = !!Object.keys(dirtyFields).length;
  const blocker = useBlocker(isDirty && !isSubmitting);

  useEffect(() => {
    if (blocker.state === 'blocked') {
      setShowConfirmationModal(true);
    }
  }, [blocker, setShowConfirmationModal]);

  const notify = (response: Page | FetchResponseError) => {
    const hasErrors = response instanceof FetchResponseError;

    setNotifications({
      type: !hasErrors ? 'success' : 'error',
      text: !hasErrors ? (
        <Translate>Saved successfully.</Translate>
      ) : (
        <Translate>An error occurred</Translate>
      ),
      ...(hasErrors && { details: response.message }),
    });
  };

  const handleRevalidate = (response: Page) => {
    if (!page.sharedId) {
      navigate(`/${response.language}/settings/pages/page/${response.sharedId}`, {
        replace: true,
      });
    } else {
      revalidator.revalidate();
    }
  };

  const save = async (data: Page) => {
    const response = await pagesAPI.save(data);

    return response;
  };

  const handleSave = async (data: Page) => {
    const response = await save(data);
    const hasErrors = response instanceof FetchResponseError;

    notify(response);

    if (!hasErrors) {
      handleRevalidate(response);
    }
  };

  const handleSaveAndPreview = async (data: Page) => {
    const response = await save(data);
    const hasErrors = response instanceof FetchResponseError;

    notify(response);

    if (!hasErrors) {
      const pageUrl = getPageUrl(response.sharedId!, response.title);
      window.open(`${window.location.origin}/${pageUrl}`);
      handleRevalidate(response);
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
          <Tabs unmountTabs={false}>
            <Tabs.Tab id="Basic" label={<Translate>Basic</Translate>}>
              <form>
                <input className="hidden" {...register('sharedId')} />
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
                    className="mb-4 w-full"
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

            <Tabs.Tab id="Code" key="html" label={<Translate>Markdown</Translate>}>
              <div className="flex flex-col gap-2 h-full">
                <HTMLNotification />
                <div className="pt-2 h-full">
                  <CodeEditor
                    language="html"
                    intialValue={page.metadata?.content}
                    onMount={editor => {
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

            <Tabs.Tab id="Advanced" label={<Translate>Javascript</Translate>}>
              <div className="flex flex-col gap-2 h-full">
                <JSNotification />
                <div className="pt-2 h-full">
                  <CodeEditor
                    language="javascript"
                    intialValue={page.metadata?.script}
                    onMount={editor => {
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
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex gap-2 justify-end">
            <Link to="/settings/pages">
              <Button styling="light" disabled={isSubmitting}>
                <Translate>Cancel</Translate>
              </Button>
            </Link>

            <Button
              styling="solid"
              color="primary"
              onClick={handleSubmit(handleSaveAndPreview)}
              disabled={getValues('entityView') || isSubmitting}
            >
              <Translate>Save & Preview</Translate>
            </Button>

            <Button
              styling="solid"
              color="success"
              onClick={handleSubmit(handleSave)}
              disabled={isSubmitting}
            >
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
