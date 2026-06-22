/* eslint-disable max-lines */
/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import { useAtomValue } from 'jotai';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid';
import { Translate, t } from '#app/I18N/index.js';
import * as pagesAPI from '#V2/api/pages/index.js';
import { Page } from '#V2/shared/types.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import {
  Button,
  CopyValueInput,
  Tabs,
  ToggleButton,
  ConfirmNavigationModal,
} from '#V2/Components/UI/index.js';
import { InputField } from '#app/V2/Components/Forms/index.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { getPageDraftUrl } from './components/PageListTable.js';
import { getPageUrl } from './components/pageUrls.js';
import { MarkdownDeprecationBanner } from './components/PageEditorComponents.js';
import { PageReleaseModal } from './components/PageReleaseModal.js';
import { PageRestoreModal, type PageRestoreReleaseRow } from './components/PageRestoreModal.js';
import { PageEditorLanguageSelector } from './components/PageEditorLanguageSelector.js';
import { PageEmbedPanel } from './components/PageEmbedPanel.js';
import {
  PageEditorCssPanel,
  PageEditorHtmlPanel,
  PageEditorJavascriptPanel,
} from './components/PageEditorCodeTabs.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import {
  buildEditorSavePayload,
  buildPageEditorFormValues,
  defaultActiveLocale,
  newPageDefaultTitle,
} from './pageEditorForm.js';

const pageEditorLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }) => {
    if (params.sharedId) {
      return pagesAPI.getBySharedIdForEditor(params.sharedId, headers);
    }

    return {};
  };

const PageEditor = () => {
  const page = useLoaderData() as Page;
  const revalidator = useRevalidator();
  const navigate = useNavigate();
  const { languages: collectionLanguages = [] } = useAtomValue(settingsAtom);
  const languages = collectionLanguages;
  const defaultLangKey = defaultActiveLocale(languages);

  const [activeLocale, setActiveLocale] = useState(defaultLangKey);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [releaseMessage, setReleaseMessage] = useState('');
  const [restoreSelected, setRestoreSelected] = useState<string[]>([]);
  const [editorLayoutKey, setEditorLayoutKey] = useState(0);
  const editorDraftValuesRef = useRef<
    Record<string, { content?: string; script?: string; css?: string }>
  >({});
  const lastAppliedLoaderSignatureRef = useRef<string | null>(null);
  const isNewPage = !page.sharedId;
  const languagesReady = languages.length > 0;
  const { notify } = useRequestStatus();

  const pageLoaderSignature = useMemo(
    () =>
      JSON.stringify({
        sharedId: page.sharedId,
        _id: page._id,
        entityView: page.entityView,
        markdownSupport: page.markdownSupport,
        locales: page.locales,
        releasesByLocale: page.releasesByLocale,
      }),
    [page]
  );

  const serverFormSeed = useMemo(
    () => buildPageEditorFormValues(page, languages),
    [pageLoaderSignature, languages, page]
  );

  useEffect(() => {
    setActiveLocale(defaultLangKey);
  }, [defaultLangKey, page.sharedId]);

  const releaseRows: PageRestoreReleaseRow[] = useMemo(
    () =>
      (page.releasesByLocale?.[activeLocale] ?? page.releases ?? []).map(r => ({
        version: r.version,
        date: r.date,
        release_message: r.release_message,
      })),
    [page.releasesByLocale, page.releases, activeLocale]
  );

  useEffect(() => {
    setEditorLayoutKey(k => k + 1);
  }, [page.sharedId]);

  const {
    register,
    formState: { errors, dirtyFields, isSubmitting },
    watch,
    getValues,
    setValue,
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: serverFormSeed,
  });

  const formSharedId = watch('sharedId');

  // Re-sync form only when loader data changes (after revalidate or navigation).
  useEffect(() => {
    if (!languagesReady) {
      return;
    }
    // After first save, navigate is pending — loader still has {}; skip until loader catches up.
    if (!page.sharedId && formSharedId) {
      return;
    }
    // Do not overwrite in-progress edits on a new page before the first save.
    if (!page.sharedId && Object.keys(dirtyFields).length > 0) {
      return;
    }
    if (lastAppliedLoaderSignatureRef.current === pageLoaderSignature) {
      return;
    }
    lastAppliedLoaderSignatureRef.current = pageLoaderSignature;
    reset(buildPageEditorFormValues(page, languages));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLoaderSignature, languagesReady, formSharedId, page, languages, dirtyFields]);

  const markdownSupport = watch('markdownSupport') === true;
  const showMarkdownDeprecation = !!watch('sharedId') && markdownSupport;
  const entityView = watch('entityView') === true;
  const embedPublic = watch('embedPublic') === true;
  const pageSharedId = watch('sharedId') || page.sharedId;
  const showPageUrlPreviews = !entityView && !!pageSharedId;
  const isDirty = !!Object.keys(dirtyFields).length;
  const activeLocaleTitle = watch(`locales.${activeLocale}.title`);
  const defaultHeaderTitle = isNewPage ? newPageDefaultTitle() : '';
  const headerTitle = activeLocaleTitle?.trim() !== '' ? activeLocaleTitle : defaultHeaderTitle;
  const urlTitle = activeLocaleTitle?.trim() !== '' ? activeLocaleTitle : newPageDefaultTitle();
  const localeDraft = watch(`locales.${activeLocale}.draft`) ?? {};

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

  const handleRevalidate = async (saved?: Page) => {
    if (!page.sharedId && saved?.sharedId) {
      await navigate(`/settings/pages/edit/${saved.sharedId}`, { replace: true });
      return;
    }
    await revalidator.revalidate();
  };

  const mergeEditorDraftValues = (data: Page): Page => {
    const payload = buildEditorSavePayload(data);
    const locales = payload.locales ?? {};

    Object.entries(editorDraftValuesRef.current).forEach(([lang, draftValues]) => {
      if (!locales[lang]) {
        return;
      }
      const currentDraft = locales[lang].draft ?? { content: '', script: '', css: '' };
      locales[lang].draft = {
        content: draftValues.content ?? currentDraft.content ?? '',
        script: draftValues.script ?? currentDraft.script ?? '',
        css: draftValues.css ?? currentDraft.css ?? '',
      };
    });

    payload.locales = locales;
    return payload;
  };

  const save = async (data: Page) => {
    const response = await pagesAPI.save(mergeEditorDraftValues(data));
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
      const previewTitle =
        response.locales?.[activeLocale]?.title ?? getValues(`locales.${activeLocale}.title`) ?? '';
      const draftPath = getPageDraftUrl(response.sharedId!, previewTitle);
      const langPrefix = `${activeLocale}/`;
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
    const saveRes = await save(data);
    if (saveRes instanceof FetchResponseError) {
      handleSaveNotification(saveRes);
      return;
    }
    const saved = saveRes as Page;
    if (!saved.sharedId) {
      return;
    }
    const publishRes = await pagesAPI.release(saved.sharedId, message);
    if (publishRes instanceof FetchResponseError) {
      notify('error', t('System', 'An error occurred', null, false), undefined, publishRes.message);
      await revalidator.revalidate();
      return;
    }
    notify('success', t('System', 'Page published successfully.', null, false));
    setReleaseModalOpen(false);
    setReleaseMessage('');
    await revalidator.revalidate();
  };

  const handleRestoreConfirm = async () => {
    const versionStr = restoreSelected[0];
    if (!versionStr) {
      return;
    }
    const sharedId = getValues('sharedId');
    if (!sharedId) {
      return;
    }
    const restoreRes = await pagesAPI.restore(sharedId, Number(versionStr));
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

  const localeErrors = errors.locales?.[activeLocale];

  return (
    <div className="tw-content flex h-full min-h-0 w-full flex-col" style={{ height: '100%' }}>
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Pages', '/settings/pages']])}
          title={headerTitle}
        />

        <SettingsContent.Body className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 flex-1" />
            <PageEditorLanguageSelector
              languages={languages}
              activeLanguage={activeLocale}
              onChange={setActiveLocale}
            />
          </div>

          {!languagesReady ? (
            <p className="pt-4 text-sm text-ink-secondary">
              <Translate>Loading</Translate>
            </p>
          ) : (
            <Tabs
              groupId="settings-page-editor"
              unmountTabs={false}
              tabListClassName="md:w-2/3 w-full"
              className="min-h-0 flex-1"
            >
              <Tabs.Tab id="Configuration" label={<Translate>Configuration</Translate>}>
                <form className="pb-6">
                  <input className="hidden" {...register('sharedId')} />
                  <div className="flex flex-col max-w-2xl gap-4 pt-2">
                    {showMarkdownDeprecation && (
                      <MarkdownDeprecationBanner
                        onUpgrade={() => setValue('markdownSupport', false, { shouldDirty: true })}
                      />
                    )}
                    <ToggleButton
                      checked={entityView}
                      onToggle={() => setValue('entityView', !entityView, { shouldDirty: true })}
                    >
                      <Translate className="text-sm font-semibold text-ink">
                        Enable this page to be used as an entity view page:
                      </Translate>
                    </ToggleButton>

                    <InputField
                      id={`title-${activeLocale}`}
                      label={<Translate>Title</Translate>}
                      {...register(`locales.${activeLocale}.title`, { required: true })}
                      hasErrors={localeErrors?.title !== undefined}
                      errorMessage={
                        localeErrors?.title && <Translate>This field is required</Translate>
                      }
                    />

                    {showPageUrlPreviews && (
                      <CopyValueInput
                        value={`/${activeLocale}/${getPageUrl(pageSharedId!, urlTitle ?? '')}`}
                        label={<Translate>URL</Translate>}
                        className="w-full"
                        id={`page-url-${activeLocale}`}
                      />
                    )}

                    {pageSharedId && showPageUrlPreviews && (
                      <Link
                        target="_blank"
                        to={`/${activeLocale}/${getPageUrl(pageSharedId!, urlTitle ?? '')}`}
                      >
                        <div className="flex gap-2 hover:font-bold hover:cursor-pointer">
                          <ArrowTopRightOnSquareIcon className="w-4" />
                          <Translate className="underline hover:text-primary-700">
                            View page
                          </Translate>
                        </div>
                      </Link>
                    )}

                    {pageSharedId && (
                      <PageEmbedPanel
                        sharedId={pageSharedId}
                        embedPublic={embedPublic}
                        onEmbedPublicChange={value =>
                          setValue('embedPublic', value, { shouldDirty: true })
                        }
                      />
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={!pageSharedId || isSubmitting}
                        onClick={() => {
                          setRestoreSelected([]);
                          setRestoreModalOpen(true);
                        }}
                      >
                        <Translate>Restore</Translate>
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={!pageSharedId || isSubmitting}
                        onClick={() => {
                          setReleaseMessage('');
                          setReleaseModalOpen(true);
                        }}
                      >
                        <Translate>Publish</Translate>
                      </Button>
                    </div>
                  </div>
                </form>
              </Tabs.Tab>

              <Tabs.Tab id="HTML" label={<Translate>HTML</Translate>}>
                <PageEditorHtmlPanel
                  activeLocale={activeLocale}
                  localeDraft={localeDraft}
                  register={register}
                  setValue={setValue}
                  onDraftChange={(language, draft) => {
                    editorDraftValuesRef.current[language] = {
                      ...editorDraftValuesRef.current[language],
                      ...draft,
                    };
                  }}
                  useLegacyMarkdown={markdownSupport}
                  editorLayoutKey={editorLayoutKey}
                />
              </Tabs.Tab>

              <Tabs.Tab id="Javascript" label={<Translate>Javascript</Translate>}>
                <PageEditorJavascriptPanel
                  activeLocale={activeLocale}
                  localeDraft={localeDraft}
                  register={register}
                  setValue={setValue}
                  onDraftChange={(language, draft) => {
                    editorDraftValuesRef.current[language] = {
                      ...editorDraftValuesRef.current[language],
                      ...draft,
                    };
                  }}
                  editorLayoutKey={editorLayoutKey}
                />
              </Tabs.Tab>

              <Tabs.Tab id="CSS" label={<Translate>CSS</Translate>}>
                <PageEditorCssPanel
                  activeLocale={activeLocale}
                  localeDraft={localeDraft}
                  register={register}
                  setValue={setValue}
                  onDraftChange={(language, draft) => {
                    editorDraftValuesRef.current[language] = {
                      ...editorDraftValuesRef.current[language],
                      ...draft,
                    };
                  }}
                  editorLayoutKey={editorLayoutKey}
                />
              </Tabs.Tab>
            </Tabs>
          )}
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex flex-wrap justify-end gap-2">
            <Link to="/settings/pages">
              <Button variant="ghost" disabled={isSubmitting}>
                <Translate>Cancel</Translate>
              </Button>
            </Link>

            <Button
              variant="primary"
              onClick={handleSubmit(handleSaveAndPreview)}
              disabled={!languagesReady || getValues('entityView') || isSubmitting}
            >
              <Translate>Save & Preview</Translate>
            </Button>

            <Button
              variant="success"
              onClick={handleSubmit(handleSave)}
              disabled={!languagesReady || isSubmitting}
            >
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
