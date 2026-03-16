/* eslint-disable max-lines */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SelectionRegion,
  HandleTextSelection,
  TextSelection,
} from '@huridocs/react-text-selection-handler';
import 'pdfjs-dist/web/pdf_viewer.css';
import { Translate } from '#app/I18N/index.js';
import { TextHighlight } from './types.js';
import { triggerScroll } from './functions/helpers.js';
import { clearSnippets, tryHighlightAndScroll } from './functions/handleSnippets.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';
import { PDFJS, CMAP_URL, EventBus, PDFDocumentProxy } from './pdfjs.js';
import { PDFPage } from './PDFPage.js';

const CHANGE_PAGE_THRESHOLD: number = 0.4;
const BORDER_WIDTH: number = 1;

type Snippet = { text: string; page: number; filename?: string };

type PDFControls = {
  goToPage: (page: number) => void;
  scrollToHighlight: (page: number, highlightKey: string) => void;
  activateSnippet: (snippet: Snippet) => void;
  deactivateSnippet: () => void;
};

interface PDFProps {
  fileUrl: string;
  highlights?: { [page: string]: TextHighlight[] };
  onSelect?: (selection: TextSelection) => any;
  onDeselect?: () => any;
  onScaleChange?: (scale: number) => void;
  onPageChange?: (pageNumber: number) => void;
  onPdfReady?: (controls: PDFControls, maxPages: number) => void;
  size?: { height?: string; width?: string };
}

const getPDFFile = async (fileUrl: string) =>
  PDFJS.getDocument({
    url: fileUrl,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    isEvalSupported: false,
  }).promise;

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
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCalledOnReadyRef = useRef(false);
  const intersectionObserverRef = useRef<IntersectionObserver | null>();
  const [currentScale, setCurrentScale] = useState(1);
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<string>();
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [pdfEventBus] = useState(new EventBus());
  const onPageChangeRef = useRef(onPageChange);

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
    elementToScroll?.scrollIntoView({ block: 'center' });
  }, []);

  const activateSnippet = useCallback((snippet: Snippet) => {
    const pageContainer = pageRefsMap.current[snippet.page];

    if (!pageContainer) {
      return;
    }

    if (tryHighlightAndScroll(pageContainer, snippet)) {
      return;
    }

    pageContainer.scrollIntoView({ block: 'start' });

    const observer = new MutationObserver(() => {
      if (tryHighlightAndScroll(pageContainer, snippet)) {
        observer.disconnect();
      }
    });

    observer.observe(pageContainer, { childList: true, subtree: true });
  }, []);

  const deactivateSnippet = useCallback(() => {
    Object.values(pageRefsMap.current).forEach(container => {
      if (container) clearSnippets(container);
    });
  }, []);

  const pdfReadyCallback = useCallback(() => {
    if (!onPdfReady || hasCalledOnReadyRef.current) {
      return;
    }

    onPdfReady(
      {
        goToPage,
        scrollToHighlight,
        activateSnippet,
        deactivateSnippet,
      },
      pdf?.numPages || 0
    );
    hasCalledOnReadyRef.current = true;
  }, [onPdfReady, goToPage, scrollToHighlight, activateSnippet, deactivateSnippet, pdf]);

  useEffect(() => {
    getPDFFile(fileUrl)
      .then(pdfFile => {
        setPDF(pdfFile);
      })
      .catch((e: Error) => {
        setError(e.message);
      });

    hasCalledOnReadyRef.current = false;
  }, [fileUrl]);

  useEffect(() => {
    const container = pdfContainerRef.current;

    if (!container) {
      return undefined;
    }

    const initialWidth = Math.max(0, container.clientWidth || container.offsetWidth);

    setContainerWidth(initialWidth);

    const resizeObserver = new ResizeObserver(entries => {
      const [entry] = entries;
      if (entry && entry.contentRect) {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }

        resizeTimeoutRef.current = setTimeout(() => {
          const newWidth = Math.max(0, entry.contentRect.width - BORDER_WIDTH);
          setContainerWidth(newWidth);
        }, 150);
      }
    });

    resizeObserver.observe(container);

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
        resizeTimeoutRef.current = null;
      }
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const observerHandler: IntersectionObserverCallback = entries => {
      entries.forEach(entry => {
        const pageNumber = Number.parseInt(entry.target.getAttribute('data-pagenumber') || '0', 10);

        if (entry.intersectionRatio >= CHANGE_PAGE_THRESHOLD) {
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
    overflow: 'auto',
    '--page-border': '0px solid transparent',
    '--page-margin': '0 auto',
    '--scale-round-x': '0',
    '--scale-round-y': '0',
  };

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <HandleTextSelection onSelect={handleSelect} onDeselect={onDeselect}>
      <div id="pdf-container" className="pdfViewer" ref={pdfContainerRef} style={viewerStyle}>
        {pdf ? (
          Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(number => {
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
        ) : (
          <Translate>Loading</Translate>
        )}
      </div>
    </HandleTextSelection>
  );
};

export type { PDFProps, Snippet, PDFControls };
export { PDF };
