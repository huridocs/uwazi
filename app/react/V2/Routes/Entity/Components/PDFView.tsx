/* eslint-disable max-statements */
/* eslint-disable max-lines */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAtomValue, useSetAtom } from 'jotai';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { t, Translate } from '#app/I18N/index.js';
import { PDF, PDFControls } from '#V2/Components/PDFViewer/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { NeedAuthorization, Truncate, Button } from '#V2/Components/UI/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { isClient } from '#app/utils/index.js';
import { settingsAtom, userAtom } from '#V2/atoms/index.js';
import { FileType } from '#V2/api/entities/types.js';
import { PlainText } from './PlainText.js';
import { OCRButton } from './OCRButton.js';
import { PAGE_PARAM, SIDE_TAB_PARAM, VIEW_MODE_PARAM } from '../urlParams.js';
import { useTocActions, convertTextSelectionToTocEntry } from './ToC/tocAtom.js';
import { useReferencesActions } from './ReferencesPanel/referencesAtom.js';
import { pdfController } from './atoms.js';

type PDFViewProps = {
  mainDocument: FileType;
  templateId?: string;
  pagePlaintext?: string;
};

const PDFView = ({ mainDocument, templateId, pagePlaintext }: PDFViewProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const user = useAtomValue(userAtom);
  const [hydrated, setHydrated] = useState(false);
  const [userIsAdminOrEditor, setUserIsAdminOrEditor] = useState(false);
  const pdfControls = useRef<PDFControls | null>(null);
  const setPDFControlsAtom = useSetAtom(pdfController);

  useEffect(() => {
    setUserIsAdminOrEditor((user?._id && ['admin', 'editor'].includes(user.role)) || false);
  }, [user]);

  const page = searchParams.get(PAGE_PARAM) || '1';
  const pageNumber = Number.parseInt(page || '1', 10);
  const initialPage = useRef<number>(pageNumber);
  const isRaw = !isClient || !hydrated || searchParams.get(VIEW_MODE_PARAM) === 'true';
  const [selectedText, setSelectedText] = useState<TextSelection | undefined>(undefined);
  const { addEntry } = useTocActions();
  const { setCreateReferenceSelection } = useReferencesActions();

  const getPageSearchParams = useCallback(
    (pageParam: number | string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(PAGE_PARAM, String(pageParam));
      return next;
    },
    [searchParams]
  );

  const updatePageParam = useCallback(
    (pageParam: number | string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(PAGE_PARAM, String(pageParam));
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams]
  );

  const onDisplayModeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      const next = new URLSearchParams(searchParams.toString());
      const currentPage = searchParams.get(PAGE_PARAM) || '1';
      if (value === VIEW_MODE_PARAM) {
        next.set(VIEW_MODE_PARAM, 'true');
      } else {
        next.delete(VIEW_MODE_PARAM);
        next.set(PAGE_PARAM, currentPage);
      }
      initialPage.current = Number(currentPage);
      pdfControls.current?.goToPage(Number(currentPage));
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams]
  );

  const handleTextSelect = useCallback((selection: TextSelection) => {
    if (selection.selectionRectangles && selection.selectionRectangles.length > 0) {
      setSelectedText(selection);
    } else {
      setSelectedText(undefined);
    }
  }, []);

  const handleTextDeselect = useCallback(() => {
    setSelectedText(undefined);
  }, []);

  const handleConnectToParagraph = useCallback(
    (selection: TextSelection) => {
      setCreateReferenceSelection(selection, 'text');
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, 'references');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, setCreateReferenceSelection]
  );

  const handleConnectToDocument = useCallback(
    (selection: TextSelection) => {
      setCreateReferenceSelection(selection, 'entity');
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, 'references');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams, setCreateReferenceSelection]
  );

  const handleAddToToC = useCallback(
    (selection: TextSelection) => {
      // Selection is already in scale=1 (normalized) from PDF onSelect
      const tocEntry = convertTextSelectionToTocEntry(selection);
      addEntry(tocEntry);
      const next = new URLSearchParams(searchParams.toString());
      next.set(SIDE_TAB_PARAM, 'toc');
      setSearchParams(next, { replace: true });
    },
    [addEntry, searchParams, setSearchParams]
  );

  const handleRemove = useCallback((_selection: TextSelection) => {
    // TODO: Implement remove functionality
  }, []);

  const handlePageNavigation = useCallback(
    (direction: 'prev' | 'next') => {
      const targetPage =
        direction === 'prev'
          ? Math.max(1, pageNumber - 1)
          : Math.min(pageNumber + 1, mainDocument?.totalPages || 0);
      if (isRaw) {
        updatePageParam(targetPage);
      } else {
        pdfControls.current?.goToPage(targetPage);
      }
    },
    [mainDocument?.totalPages, isRaw, pageNumber, updatePageParam]
  );

  const handlePageChange = useCallback(
    (newPageNumber: number) => {
      if (newPageNumber !== initialPage.current) {
        initialPage.current = newPageNumber;
        updatePageParam(newPageNumber);
      }
    },
    [updatePageParam]
  );

  useEffect(() => {
    setHydrated(true);
  }, []);

  const { filename, originalname, totalPages } = mainDocument || {
    filename: '',
    originalname: '',
    totalPages: 0,
  };
  const prevPage = Math.max(1, pageNumber - 1);
  const nextPage = Math.min(pageNumber + 1, totalPages || 0);

  return (
    <Panel>
      <Panel.Body>
        <div className="flex h-full min-h-0 flex-col gap-(--spacing-theme-3)">
          <div className="w-full rounded-md border border-[color-mix(in_srgb,var(--color-theme-border-default)_65%,transparent)] bg-(--color-theme-surface-warm) p-(--spacing-theme-3)">
            <div className="flex flex-row justify-between gap-(--spacing-theme-2)">
              <div className="min-w-0">
                <TemplateLabel templateId={templateId} />
              </div>
              <div className="shrink-0">
                <label htmlFor="render-mode" className="sr-only">
                  <Translate>View</Translate>
                </label>
                <select
                  id="render-mode"
                  className="rounded-md border border-[color-mix(in_srgb,var(--color-theme-border-default)_80%,transparent)] bg-(--color-theme-surface-raised) px-(--spacing-theme-3) py-(--spacing-theme-1) text-xs font-medium text-ink focus:border-(--color-theme-control-border-focus) focus:outline-hidden"
                  value={isRaw ? 'raw' : 'normal'}
                  onChange={onDisplayModeChange}
                >
                  <option value="raw">{t('System', 'Plain text', null, false)}</option>
                  <option value="normal">{t('System', 'PDF', null, false)}</option>
                </select>
              </div>
            </div>
            <Truncate maxLength={80}>
              <h2 className="mt-(--spacing-theme-2) text-base font-bold text-ink">
                {originalname}
              </h2>
            </Truncate>
          </div>
          <div
            className={`flex-1 min-h-0 overflow-hidden rounded-md bg-(--color-theme-surface-warm) ${isRaw ? 'hidden' : 'block'}`}
          >
            <PDF
              fileUrl={`/api/files/${filename}`}
              size={{ height: '100%', width: '90%' }}
              onSelect={handleTextSelect}
              onDeselect={handleTextDeselect}
              onPageChange={handlePageChange}
              onPdfReady={controls => {
                const targetPage = initialPage.current || 1;
                pdfControls.current = controls;
                setPDFControlsAtom(controls);
                if (targetPage !== 1) {
                  controls.goToPage(targetPage);
                }
              }}
            />
          </div>
          <div
            className={`flex-1 min-h-0 overflow-auto rounded-md bg-(--color-theme-surface-warm) ${isRaw ? 'block' : 'hidden'}`}
          >
            <PlainText text={pagePlaintext || ''} />
          </div>
        </div>
      </Panel.Body>

      <Panel.Footer highlighted={Boolean(selectedText && userIsAdminOrEditor)}>
        {selectedText && userIsAdminOrEditor ? (
          <NeedAuthorization roles={['admin', 'editor']}>
            <div className="flex flex-row gap-2 items-center w-full">
              <Button variant="secondary" onClick={() => handleConnectToParagraph(selectedText)}>
                <Translate>Connect to paragraph</Translate>
              </Button>
              <Button variant="secondary" onClick={() => handleConnectToDocument(selectedText)}>
                <Translate>Connect to document</Translate>
              </Button>
              <Button variant="secondary" onClick={() => handleAddToToC(selectedText)}>
                <Translate>Add to ToC</Translate>
              </Button>
              <div className="ml-auto">
                <Button variant="secondary" onClick={() => handleRemove(selectedText)}>
                  <Translate>Remove</Translate>
                </Button>
              </div>
            </div>
          </NeedAuthorization>
        ) : (
          <div className="flex flex-row items-center w-full gap-(--spacing-theme-3)">
            <div className="justify-self-start grow">
              {ocrServiceEnabled && mainDocument && (
                <NeedAuthorization roles={['admin', 'editor']}>
                  <OCRButton file={mainDocument} />
                </NeedAuthorization>
              )}
            </div>
            <div className="justify-self-end flex items-center gap-(--spacing-theme-2) text-xs font-medium">
              <button
                type="button"
                onClick={() => handlePageNavigation('prev')}
                disabled={pageNumber <= 1}
                className="text-ink-secondary hover:text-ink disabled:text-ink-muted disabled:hover:text-ink-muted"
              >
                <Translate>Previous</Translate>
              </button>
              <div className="rounded bg-(--color-theme-surface-warm) px-(--spacing-theme-2) py-(--spacing-theme-1) text-ink">
                {pageNumber} / {totalPages}
              </div>
              <button
                type="button"
                onClick={() => handlePageNavigation('next')}
                disabled={totalPages ? nextPage > totalPages : false}
                className="text-ink-secondary hover:text-ink disabled:text-ink-muted disabled:hover:text-ink-muted"
              >
                <Translate>Next</Translate>
              </button>
            </div>
            <div className="sr-only">
              <a href={`?${getPageSearchParams(prevPage).toString()}`} rel="prev">
                {t('System', 'Previous', null, false)}
              </a>
              <a href={`?${getPageSearchParams(nextPage).toString()}`} rel="next">
                {t('System', 'Next', null, false)}
              </a>
            </div>
          </div>
        )}
      </Panel.Footer>
    </Panel>
  );
};

export { PDFView };
