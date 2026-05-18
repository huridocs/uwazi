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
import type { PageRelease } from '#shared/types/pageType.js';
import { getPageUrl, getPageDraftUrl } from './components/PageListTable.js';
import {
  HTMLNotification,
  JSNotification,
  MarkdownDeprecationBanner,
} from './components/PageEditorComponents.js';
import { PageReleaseModal } from './components/PageReleaseModal.js';
import { PageRestoreModal, type PageRestoreReleaseRow } from './components/PageRestoreModal.js';
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
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [releaseMessage, setReleaseMessage] = useState('');
  const [restoreSelected, setRestoreSelected] = useState<string[]>([]);
  const [editorLayoutKey, setEditorLayoutKey] = useState(0);
  const { notify } = useRequestStatus();

  const formValues: Page = useMemo(() => {
    const p = page as Page;
    const draftContent = p.draft?.content ?? p.metadata?.content ?? '';
    const draftScript = p.draft?.script ?? p.metadata?.script ?? '';
    const draftCss = p.draft?.css ?? p.metadata?.css ?? '';
    return {
      ...p,
      title: p.title ?? t('System', 'New page', null, false),
      metadata: {
        ...p.metadata,
        content: draftContent,
        script: draftScript,
        css: draftCss,
      },
      draft: {
        content: draftContent,
        script: draftScript,
        css: draftCss,
      },
      releases: p.releases ?? [],
    };
  }, [page]);

  const releaseRows: PageRestoreReleaseRow[] = useMemo(
    () =>
      (page.releases ?? []).map(r => ({
        version: r.version,
        date: r.date,
        release_message: r.release_message,
      })),
    [page.releases]
  );

  useEffect(() => {
    setEditorLayoutKey(k => k + 1);
  }, [page.sharedId]);

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

  const markdownSupport = watch('markdownSupport') === true;
  const showMarkdownDeprecation = !!watch('sharedId') && markdownSupport;
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
    const d = payload.draft ?? {};
    const content = d.content ?? payload.metadata?.content ?? '';
    const script = d.script ?? payload.metadata?.script ?? '';
    const css = d.css ?? payload.metadata?.css ?? '';
    payload.metadata = {
      ...payload.metadata,
      content,
      script,
      css,
    };
    payload.draft = { content, script, css };
    if (!payload.sharedId && payload.markdownSupport !== false) {
      delete (payload as { markdownSupport?: boolean }).markdownSupport;
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
      const draftPath = getPageDraftUrl(response.sharedId!, response.title);
      const langPrefix = response.language ? `${response.language}/` : '';
      window.open(`${window.location.origin}/${langPrefix}${draftPath}`);
      await handleRevalidate(response);
    }
  };

  const handlePublishConfirm = async () => {
    const message = releaseMessage.trim();
    if (!message) {
      return;
    }
    const data = getValues();
    const saveRes = await save(buildSavePayload(data));
    if (saveRes instanceof FetchResponseError) {
      handleSaveNotification(saveRes);
      return;
    }
    const saved = saveRes as Page;
    const prior = [...(saved.releases ?? [])];
    const nextVersion = prior.length ? prior[prior.length - 1].version + 1 : 1;
    const d =
      saved.draft ??
      ({
        content: saved.metadata?.content ?? '',
        script: saved.metadata?.script ?? '',
        css: saved.metadata?.css ?? '',
      } as NonNullable<Page['draft']>);
    const nextReleases: PageRelease[] = [
      ...prior,
      {
        version: nextVersion,
        content: d.content ?? '',
        script: d.script,
        css: d.css,
        release_message: message,
        date: Date.now(),
      },
    ];
    const publishRes = await save(
      buildSavePayload({
        ...saved,
        releases: nextReleases,
        draft: d,
      })
    );
    if (publishRes instanceof FetchResponseError) {
      notify('error', t('System', 'An error occurred', null, false), undefined, publishRes.message);
      await revalidator.revalidate();
      return;
    }
    notify('success', t('System', 'Page published successfully.', null, false));
    setReleaseModalOpen(false);
    setReleaseMessage('');
    await handleRevalidate(publishRes as Page);
  };

  const handleRestoreConfirm = async () => {
    const versionStr = restoreSelected[0];
    if (!versionStr) {
      return;
    }
    const base = getValues();
    const releases = base.releases ?? [];
    const rel = releases.find(r => String(r.version) === versionStr);
    if (!rel) {
      notify(
        'error',
        t('System', 'An error occurred', null, false),
        undefined,
        t('System', 'Version not found', null, false)
      );
      return;
    }
    const restoreRes = await save(
      buildSavePayload({
        ...base,
        draft: {
          content: rel.content ?? '',
          script: rel.script ?? '',
          css: rel.css ?? '',
        },
      })
    );
    if (restoreRes instanceof FetchResponseError) {
      notify('error', t('System', 'An error occurred', null, false), undefined, restoreRes.message);
      return;
    }
    notify('success', t('System', 'Draft restored from release.', null, false));
    setRestoreModalOpen(false);
    setRestoreSelected([]);
    await revalidator.revalidate();
    setEditorLayoutKey(k => k + 1);
  };

  const canUsePageActions = !watch('entityView') && !!watch('sharedId');

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
                      onUpgrade={() => setValue('markdownSupport', false, { shouldDirty: true })}
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
                <HTMLNotification useLegacyMarkdown={markdownSupport} />
                <div className="h-full pt-2">
                  <CodeEditor
                    key={`html-${editorLayoutKey}`}
                    language="html"
                    intialValue={watch('draft.content') ?? ''}
                    onMount={(editor: any) => {
                      editor.getModel()?.onDidChangeContent(
                        debouncedChangeHandler(() => {
                          setValue('draft.content', editor.getValue(), { shouldDirty: true });
                        })
                      );
                    }}
                    fallbackElement={
                      <textarea {...register('draft.content')} className="w-full h-full" />
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
                    key={`js-${editorLayoutKey}`}
                    language="javascript"
                    intialValue={watch('draft.script') ?? ''}
                    onMount={(editor: any) => {
                      editor.getModel()?.onDidChangeContent(
                        debouncedChangeHandler(() => {
                          setValue('draft.script', editor.getValue(), { shouldDirty: true });
                        })
                      );
                    }}
                    fallbackElement={
                      <textarea {...register('draft.script')} className="w-full h-full" />
                    }
                  />
                </div>
              </div>
            </Tabs.Tab>

            <Tabs.Tab id="CSS" label={<Translate>CSS</Translate>}>
              <div className="flex flex-col h-full gap-2">
                <div className="h-full pt-2">
                  <CodeEditor
                    key={`css-${editorLayoutKey}`}
                    language="css"
                    intialValue={watch('draft.css') ?? ''}
                    onMount={(editor: any) => {
                      editor.getModel()?.onDidChangeContent(
                        debouncedChangeHandler(() => {
                          setValue('draft.css', editor.getValue(), { shouldDirty: true });
                        })
                      );
                    }}
                    fallbackElement={
                      <textarea {...register('draft.css')} className="w-full h-full" />
                    }
                  />
                </div>
              </div>
            </Tabs.Tab>
          </Tabs>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex flex-wrap justify-end gap-2">
            <Link to="/settings/pages">
              <Button variant="ghost" disabled={isSubmitting}>
                <Translate>Cancel</Translate>
              </Button>
            </Link>

            {canUsePageActions && (
              <Button
                variant="secondary"
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setRestoreSelected([]);
                  setRestoreModalOpen(true);
                }}
              >
                <Translate>Restore</Translate>
              </Button>
            )}

            {canUsePageActions && (
              <Button
                variant="secondary"
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setReleaseMessage('');
                  setReleaseModalOpen(true);
                }}
              >
                <Translate>Publish</Translate>
              </Button>
            )}

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

      <PageReleaseModal
        isOpen={releaseModalOpen}
        onClose={() => {
          setReleaseModalOpen(false);
          setReleaseMessage('');
        }}
        releaseMessage={releaseMessage}
        onReleaseMessageChange={setReleaseMessage}
        onPublish={async () => {
          await handlePublishConfirm();
        }}
      />

      <PageRestoreModal
        isOpen={restoreModalOpen}
        onClose={() => {
          setRestoreModalOpen(false);
          setRestoreSelected([]);
        }}
        releases={releaseRows}
        selectedValues={restoreSelected}
        onSelectionChange={setRestoreSelected}
        onRestore={async () => {
          await handleRestoreConfirm();
        }}
      />

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
