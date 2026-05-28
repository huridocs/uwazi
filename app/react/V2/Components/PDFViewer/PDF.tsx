/* eslint-disable max-lines */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SelectionRegion,
  HandleTextSelection,
  TextSelection,
} from '@huridocs/react-text-selection-handler';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import 'pdfjs-dist/web/pdf_viewer.css';
import { Translate } from '#app/I18N/index.js';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import { TextHighlight } from './types.js';
import { triggerScroll } from './functions/helpers.js';
import { clearSnippets, tryHighlightAndScroll } from './functions/handleSnippets.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';
import { waitForElement } from './functions/waitForElement.js';
import { PDFJS, CMAP_URL, EventBus, PDFDocumentProxy } from './pdfjs.js';
import { useContainerWidth } from './hooks/useContainerWidth.js';
import { PDFPage } from './PDFPage.js';
import { BlankState, ProgressBar } from '../UI/index.js';
import { reportErrorToSentry } from '#app/V2/shared/errorUtils.js';

const CHANGE_PAGE_THRESHOLD: number = 0.4;
const BORDER_WIDTH: number = 1;
const WIDTH_SAFETY_BUFFER: number = 2;

type Snippet = { text: string; page: number; filename?: string };

type PDFControls = {
  goToPage: (page: number) => void;
  scrollToHighlight: (page: number, highlightKey: string) => void;
  activateSnippet: (snippet: Snippet) => void;
  deactivateSnippet: () => void;
  toggleHighlights: (highlighs?: { [page: number]: TextHighlight[] }[]) => void;
};

interface PDFProps {
  fileUrl: string;
  highlights?: { [page: number]: TextHighlight[] };
  onSelect?: (selection: TextSelection) => any;
  onDeselect?: () => any;
  onScaleChange?: (scale: number) => void;
  onPageChange?: (pageNumber: number) => void;
  onPdfReady?: (controls: PDFControls, maxPages: number) => void;
  size?: { height?: string; width?: string };
}

// eslint-disable-next-line max-statements
const PDF = ({
  fileUrl,
  highlights,
  onSelect = () => undefined,
  onDeselect,
  onScaleChange,
  onPageChange,
  onPdfReady,
  size,
}: PDFProps) => {
  const pageRefsMap = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const animationFrameIdRef = useRef<number>(0);
  const snippetAnimationFrameIdRef = useRef<number>(0);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);
  const isReady = useRef(false);
  const intersectionObserverRef = useRef<IntersectionObserver | null>();
  const [currentScale, setCurrentScale] = useState(1);
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<React.ReactNode>();
  const containerWidth = useContainerWidth(pdfContainerRef, {
    borderWidth: BORDER_WIDTH,
    safetyBuffer: WIDTH_SAFETY_BUFFER,
  });
  const [pdfEventBus] = useState(new EventBus());
  const [loading, setLoading] = useState<{ progress: number; isLoading: boolean }>({
    isLoading: true,
    progress: 0,
  });
  const onPageChangeRef = useRef(onPageChange);
  const [internalHighlights, setInternalHighlights] = useState([highlights]);

  const setPdfContainer = useCallback((element: HTMLDivElement | null) => {
    pdfContainerRef.current = element;
  }, []);

  const handleScaleChange = useCallback(
    (scale: number) => {
      setCurrentScale(scale);
      onScaleChange?.(scale);
    },
    [onScaleChange]
  );

  const handleSelect = useCallback(
    (selection: TextSelection) => {
      const normalized = adjustSelectionsToScale(selection, currentScale, true);
      onSelect(normalized);
    },
    [onSelect, currentScale]
  );

  const goToPage = useCallback(
    (page: number) => {
      const pageRef = { current: pageRefsMap.current[page] };
      animationFrameIdRef.current = triggerScroll(pageRef, animationFrameIdRef.current);
    },
    [pageRefsMap]
  );

  const scrollToHighlight = useCallback((page: number, highlightKey: string) => {
    const highlightWrapper = pdfContainerRef.current?.querySelector(
      `[data-highlight-key="${page}-${highlightKey}"]`
    );
    const highlightRectangle = highlightWrapper?.querySelector('.highlight-rectangle');
    const elementToScroll = highlightRectangle || highlightWrapper;
    scrollIntoView(elementToScroll, { block: 'center' });
  }, []);

  const activateSnippet = useCallback((snippet: Snippet) => {
    const pageContainer = pageRefsMap.current[snippet.page];

    if (!pageContainer) {
      return;
    }

    if (tryHighlightAndScroll(pageContainer, snippet)) {
      return;
    }

    scrollIntoView(pageContainer, { block: 'start' });

    waitForElement(`#page-${snippet.page}-container .textLayer`, 5000)
      .then(() => {
        tryHighlightAndScroll(pageContainer, snippet);
      })
      .catch(() => {
        // ignore timeout
      });
  }, []);

  const deactivateSnippet = useCallback(() => {
    Object.values(pageRefsMap.current).forEach(container => {
      if (container) clearSnippets(container);
    });
  }, []);

  const toggleHighlights = useCallback(
    (newHighlights?: { [page: number]: TextHighlight[] }[]) => {
      if (newHighlights?.length) {
        setInternalHighlights([highlights, ...newHighlights]);
        const [firstHighlight] = Object.entries(newHighlights[0] || {});
        if (firstHighlight) {
          const [page, highlight] = firstHighlight;

          const pageContainer = pageRefsMap.current[Number(page)];
          if (pageContainer) {
            const selector = `#page-${page}-container [data-highlight-key="${page}-${highlight[0].key}"]`;
            waitForElement(selector, 5000)
              .then(found => {
                const highlightRectangle = (found as Element).querySelector
                  ? (found as Element).querySelector('.highlight-rectangle')
                  : null;
                const elementToScroll = highlightRectangle;
                scrollIntoView(elementToScroll, { block: 'center', behavior: 'smooth' });
              })
              .catch(() => {
                // ignore timeout
              });
          }
        }
      } else {
        setInternalHighlights([highlights]);
      }
    },
    [highlights]
  );

  const pdfReadyCallback = useCallback(() => {
    if (isReady.current) {
      return;
    }

    if (onPdfReady) {
      onPdfReady(
        {
          goToPage,
          scrollToHighlight,
          activateSnippet,
          deactivateSnippet,
          toggleHighlights,
        },
        pdf?.numPages || 0
      );
    }

    isReady.current = true;
  }, [
    onPdfReady,
    goToPage,
    scrollToHighlight,
    activateSnippet,
    deactivateSnippet,
    toggleHighlights,
    pdf,
  ]);

  useEffect(() => {
    const handleLoading = (taskData: { loaded: number; total: number; percent: number }) => {
      if (taskData.percent < 100) {
        setLoading({ isLoading: true, progress: taskData.percent });
      } else {
        setLoading({ isLoading: false, progress: 0 });
      }
    };

    const loadingTask = PDFJS.getDocument({
      url: fileUrl,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
      isEvalSupported: false,
    });

    loadingTask.onProgress = handleLoading;

    loadingTask.promise
      .then(file => {
        setPDF(file);
      })
      .catch(e => {
        if (e.status === 404) {
          setError(
            <Translate>
              This file is currently unavailable. Please contact your administrator if the issue
              persists.
            </Translate>
          );
        } else if (e.name === 'InvalidPDFException') {
          setError(
            <Translate>
              This file could not be opened. It may be corrupted or not a valid PDF.
            </Translate>
          );
        } else {
          setError(
            <Translate>This file could not be displayed. Try refreshing the page.</Translate>
          );
          reportErrorToSentry(e, 'pdf-error');
        }
      });

    isReady.current = false;

    return () => {
      isReady.current = false;
    };
  }, [fileUrl]);

  useEffect(() => {
    const observerHandler: IntersectionObserverCallback = entries => {
      entries.forEach(entry => {
        const pageNumber = Number.parseInt(entry.target.getAttribute('data-pagenumber') || '0', 10);

        if (isReady.current && entry.intersectionRatio >= CHANGE_PAGE_THRESHOLD) {
          onPageChangeRef.current?.(pageNumber);
        }

        if (entry.isIntersecting) {
          pdfEventBus.dispatch('renderpage', { pageNumber });
        } else {
          pdfEventBus.dispatch('unmountpage', { pageNumber });
        }
      });
    };

    intersectionObserverRef.current = new IntersectionObserver(observerHandler, {
      root: null,
      rootMargin: '500px 0px 500px 0px',
      threshold: [0.1, CHANGE_PAGE_THRESHOLD],
    });

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [pdfEventBus]);

  useEffect(() => {
    const readyHandler = ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === 1) {
        pdfEventBus.dispatch('renderpage', { pageNumber });
      }
    };

    const renderedHandler = ({ pageNumber }: { pageNumber: number }) => {
      if (Number(pageNumber) === 1) {
        pdfReadyCallback();
        pdfEventBus.off('pagerendered', renderedHandler);
      }
    };

    pdfEventBus.on('pageready', readyHandler);
    pdfEventBus.on('pagerendered', renderedHandler);

    return () => {
      pdfEventBus.off('pageready', readyHandler);
      pdfEventBus.off('pagerendered', renderedHandler);
    };
  }, [pdfReadyCallback, pdfEventBus]);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(
    () => () => {
      cancelAnimationFrame(animationFrameIdRef.current);
      cancelAnimationFrame(snippetAnimationFrameIdRef.current);
    },
    []
  );

  const viewerStyle = {
    height: size?.height || '100%',
    width: size?.width || '100%',
    '--page-border': 'none',
    '--page-margin': '0',
  } as React.CSSProperties;

  if (error) {
    return (
      <div data-testid="errorInfo" className="h-full">
        <BlankState
          icon={
            <ExclamationTriangleIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />
          }
          title={error}
          description=""
        />
      </div>
    );
  }

  return (
    <HandleTextSelection onSelect={handleSelect} onDeselect={onDeselect}>
      <div className="w-full flex flex-col gap-2 h-full">
        {loading.isLoading || !pdf ? (
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between mb-1">
              <div className="font-medium text-ink-muted">
                <Translate>Loading</Translate> ...
              </div>
              <span className="text-sm font-medium text-ink-muted">{loading.progress}%</span>
            </div>
            <ProgressBar progress={loading.progress} color="gray" />
          </div>
        ) : null}
        <div id="pdf-container" className="pdfViewer" ref={setPdfContainer} style={viewerStyle}>
          {pdf
            ? Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(number => {
                const regionId = number;
                let pageHighlights;

                if (internalHighlights.length) {
                  const highlightsForPage = internalHighlights.find(
                    highligh => highligh && highligh[regionId]
                  );
                  pageHighlights = highlightsForPage?.[regionId];
                }

                return (
                  <div
                    key={`page-${regionId}`}
                    id={`page-${regionId}-container`}
                    ref={el => {
                      pageRefsMap.current[regionId] = el;
                    }}
                    className={[
                      'relative mb-4 border-solid',
                      `[border-width:${BORDER_WIDTH}px]`,
                      'border-[color-mix(in_srgb,var(--color-theme-border-default)_55%,transparent)]',
                    ].join(' ')}
                  >
                    <SelectionRegion regionId={regionId.toString()}>
                      <PDFPage
                        pdf={pdf}
                        page={number}
                        eventBus={pdfEventBus}
                        intersectionObserver={intersectionObserverRef.current}
                        highlights={pageHighlights}
                        containerWidth={containerWidth}
                        onScaleChange={handleScaleChange}
                      />
                    </SelectionRegion>
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </HandleTextSelection>
  );
};

export type { PDFProps, Snippet, PDFControls };
export { PDF };
