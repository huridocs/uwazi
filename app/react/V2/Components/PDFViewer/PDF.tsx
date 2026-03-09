/* eslint-disable max-lines */
import React, {
  CSSProperties,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  SelectionRegion,
  HandleTextSelection,
  TextSelection,
} from '@huridocs/react-text-selection-handler';
import { getDocument, PDFDocumentProxy } from 'pdfjs-dist/webpack.mjs';
import { EventBus } from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/web/pdf_viewer.css';
import { Translate } from '#app/I18N/index.js';
import { TextHighlight } from './types.js';
import { triggerScroll } from './functions/helpers.js';
import { highlightSnippetInPage, clearSnippets } from './functions/snippetToHighlight.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';
import { PDFPage } from './PDFPage.js';

type Snippet = { text: string; page: number; filename?: string };

interface PDFProps {
  fileUrl: string;
  highlights?: { [page: string]: TextHighlight[] };
  onSelect?: (selection: TextSelection) => any;
  onDeselect?: () => any;
  onScaleChange?: (scale: number) => void;
  onPageChange?: (pageNumber: number) => void;
  onPdfReady?: () => void;
  size?: { height?: string; width?: string; overflow?: string };
}

const getPDFFile = async (fileUrl: string) =>
  getDocument({
    url: fileUrl,
    cMapUrl: 'legacy_character_maps/',
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
  const pageRefsMap = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationFrameIdRef = useRef(0);
  const intersectionObserverRef = useRef<IntersectionObserver | null>();
  const [currentScale, setCurrentScale] = useState(1);
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<string>();
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [pdfEventBus] = useState(new EventBus());

  // useImperativeHandle(
  //   ref,
  //   () => ({
  //     goToPage(pageNumber: number) {
  //       const pageRef = { current: pageRefsMap.current[pageNumber.toString()] };
  //       animationFrameIdRef.current = triggerScroll(pageRef, animationFrameIdRef.current);
  //     },
  //     scrollToHighlight(highlightKey: string) {
  //       const highlightWrapper = pdfContainerRef.current?.querySelector(
  //         `[data-highlight-key="${highlightKey}"]`
  //       );
  //       const highlightRectangle = highlightWrapper?.querySelector('.highlight-rectangle');
  //       const elementToScroll = highlightRectangle || highlightWrapper;
  //       elementToScroll?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     },
  //     activateSnippet(snippet: Snippet) {
  //       const pageContainer = pageRefsMap.current[snippet.page.toString()];
  //       if (pageContainer) {
  //         highlightSnippetInPage(pageContainer, snippet);
  //         const firstMark = pageContainer.querySelector('mark');
  //         firstMark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //       }
  //     },
  //     deactivateSnippet() {
  //       Object.values(pageRefsMap.current).forEach(container => {
  //         if (container) clearSnippets(container);
  //       });
  //     },
  //   }),
  //   []
  // );

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

  useEffect(() => {
    getPDFFile(fileUrl)
      .then(pdfFile => {
        setPDF(pdfFile);
      })
      .catch((e: Error) => {
        setError(e.message);
      });
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
          const newWidth = Math.max(0, entry.contentRect.width);
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
    if (pdf && containerWidth) {
      onPdfReady?.();
    }
    return () => undefined;
  }, [pdf, containerWidth, onPdfReady]);

  useEffect(() => {
    const observerHandler: IntersectionObserverCallback = entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          pdfEventBus.dispatch('renderpage', {
            pageNumber: entry.target.getAttribute('data-pagenumber'),
          });
        } else {
          pdfEventBus.dispatch('unmountpage', {
            pageNumber: entry.target.getAttribute('data-pagenumber'),
          });
        }
      });
    };

    intersectionObserverRef.current = new IntersectionObserver(observerHandler, {
      root: null,
      rootMargin: '500px 0px 500px 0px',
      scrollMargin: '500px 0px 500px 0px',
      threshold: 0.1,
    });

    return () => {
      intersectionObserverRef.current?.disconnect();
    };
  }, [pdfEventBus]);

  useEffect(() => {
    pdfEventBus.on('pageready', ({ pageNumber }: { pageNumber: number }) => {
      if (pageNumber === 1) {
        pdfEventBus.dispatch('renderpage', { pageNumber });
      }
    });
  }, [pdfEventBus]);

  useEffect(() => {
    pdfEventBus.on('pagesinit', params => {
      console.log('pagesinit', params);
    });

    pdfEventBus.on('pagerendered', params => {
      console.log('pagerendered', params);
    });

    pdfEventBus.on('pagechanging', params => {
      console.log('pagechanging', params);
    });

    pdfEventBus.on('textlayerrendered', params => {
      console.log('textlayerrendered', params);
    });

    pdfEventBus.on('scalechanging', params => {
      console.log('scalechanging', params);
    });

    pdfEventBus.on('annotationlayerrendered', params => {
      console.log('annotationlayerrendered', params);
    });

    pdfEventBus.on('updateviewarea', params => {
      console.log('updateviewarea', params);
    });
  }, [pdfEventBus]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <HandleTextSelection onSelect={handleSelect} onDeselect={onDeselect}>
      <div
        id="pdf-container"
        className="pdfViewer"
        ref={pdfContainerRef}
        style={{
          height: size?.height || '100%',
          width: size?.width || '100%',
          overflow: size?.overflow || 'auto',
        }}
      >
        {pdf ? (
          Array.from({ length: pdf.numPages }, (_, index) => index + 1).map(number => {
            const regionId = number.toString();
            const pageHighlights = highlights ? highlights[regionId] : undefined;

            return (
              <div
                key={`page-${regionId}`}
                id={`page-${regionId}-container`}
                ref={el => {
                  pageRefsMap.current[regionId] = el;
                }}
              >
                <SelectionRegion regionId={regionId}>
                  <PDFPage
                    pdf={pdf}
                    page={number}
                    eventBus={pdfEventBus}
                    intersectionObserver={intersectionObserverRef.current}
                    highlights={pageHighlights}
                    containerWidth={containerWidth}
                    onScaleChange={handleScaleChange}
                    onPageChange={onPageChange}
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

export type { PDFProps, Snippet };
export { PDF };
