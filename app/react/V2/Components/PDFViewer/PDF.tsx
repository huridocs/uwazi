/* eslint-disable max-lines */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SelectionRegion,
  HandleTextSelection,
  TextSelection,
} from '@huridocs/react-text-selection-handler';
import { t, Translate } from '#app/I18N/index.js';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import { TextHighlight } from './types.js';
import { triggerScroll } from './functions/helpers.js';
import { clearSnippets, tryHighlightAndScroll } from './functions/handleSnippets.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';
import { PDFJS, CMAP_URL, EventBus, PDFDocumentProxy } from './pdfjs.js';
import { useContainerWidth } from './hooks/useContainerWidth.js';
import { PDFPage } from './PDFPage.js';
import { ProgressBar } from '../UI/index.js';
import 'pdfjs-dist/web/pdf_viewer.css';

const CHANGE_PAGE_THRESHOLD: number = 0.4;
const BORDER_WIDTH: number = 1;
const WIDTH_SAFETY_BUFFER: number = 2;

type Snippet = { text: string; page: number; filename?: string };

type PDFControls = {
  goToPage: (page: number) => void;
  scrollToHighlight: (page: number, highlightKey: string) => void;
  activateSnippet: (snippet: Snippet) => void;
  deactivateSnippet: () => void;
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
  const [error, setError] = useState<string>();
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

    let observerTimeoutId: string | number | NodeJS.Timeout | undefined;

    if (tryHighlightAndScroll(pageContainer, snippet)) {
      return;
    }

    scrollIntoView(pageContainer, { block: 'start' });

    const observer = new MutationObserver(() => {
      if (tryHighlightAndScroll(pageContainer, snippet)) {
        observer.disconnect();
        clearTimeout(observerTimeoutId);
      }
    });

    observerTimeoutId = setTimeout(() => {
      observer.disconnect();
    }, 5000);

    observer.observe(pageContainer, { childList: true, subtree: true });
  }, []);

  const deactivateSnippet = useCallback(() => {
    Object.values(pageRefsMap.current).forEach(container => {
      if (container) clearSnippets(container);
    });
  }, []);

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
        },
        pdf?.numPages || 0
      );
    }

    isReady.current = true;
  }, [onPdfReady, goToPage, scrollToHighlight, activateSnippet, deactivateSnippet, pdf]);

  useEffect(() => {
    const handleLoading = (taksData: { loaded: number; total: number; percent: number }) => {
      if (taksData.percent < 100) {
        setLoading({ isLoading: true, progress: taksData.percent });
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
          setError(t('System', 'This file is no longer available.', null, false));
        } else if (e.name === 'InvalidPDFException') {
          setError(
            t(
              'System',
              'This file could not be opened. It may be corrupted or not a valid PDF.',
              null,
              false
            )
          );
        } else {
          setError(
            t('System', 'This file could not be displayed. Try refreshing the page.', null, false)
          );
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
      <p
        data-testid="errorInfo"
        className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400"
      >
        {error}
      </p>
    );
  }

  return (
    <HandleTextSelection onSelect={handleSelect} onDeselect={onDeselect}>
      <div className="w-full flex flex-col gap-2 h-full">
        {loading.isLoading || !pdf ? (
          <div className="w-full flex flex-col gap-2">
            <div className="flex justify-between mb-1">
              <div className="font-medium text-gray-500">
                <Translate>Loading</Translate> ...
              </div>
              <span className="text-sm font-medium text-gray-500">{loading.progress}%</span>
            </div>
            <ProgressBar progress={loading.progress} color="gray" />
          </div>
        ) : null}
        <div id="pdf-container" className="pdfViewer" ref={setPdfContainer} style={viewerStyle}>
          {pdf
            ? Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(number => {
                const regionId = number;
                const pageHighlights = highlights ? highlights[regionId] : undefined;

                return (
                  <div
                    key={`page-${regionId}`}
                    id={`page-${regionId}-container`}
                    style={{ borderWidth: BORDER_WIDTH }}
                    ref={el => {
                      pageRefsMap.current[regionId] = el;
                    }}
                    className="mb-4 border-gray-200 relative"
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
