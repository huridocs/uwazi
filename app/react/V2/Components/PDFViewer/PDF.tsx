import React, {
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
import { Translate } from '#app/I18N/index.js';
import { TextHighlight } from './types.js';
import { triggerScroll } from './functions/helpers.js';
import { highlightSnippetInPage, clearSnippets } from './functions/snippetToHighlight.js';
import { adjustSelectionsToScale } from './functions/handleTextSelection.js';
import { PDFPage } from './PDFPage.js';

type Snippet = { text: string; page: number; filename?: string };

interface PDFHandle {
  goToPage: (pageNumber: number) => void;
  scrollToHighlight: (highlightKey: string) => void;
  activateSnippet: (snippet: Snippet) => void;
  deactivateSnippet: () => void;
}

interface PDFProps {
  fileUrl: string;
  /** Highlights in scale=1 (normalized) coordinates; converted to display scale when drawing */
  highlights?: { [page: string]: TextHighlight[] };
  /** Called with selection in scale=1 (normalized) coordinates, ready to store */
  onSelect?: (selection: TextSelection) => any;
  onDeselect?: () => any;
  /** Called when the PDF render scale changes (e.g. for scroll-to-reference in display coords) */
  onScaleChange?: (scale: number) => void;
  /** Called when the visible page changes (for URL sync etc.) */
  onPageChange?: (pageNumber: number) => void;
  /** Called when PDF and container are ready (e.g. to scroll to initial highlight) */
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

const PDF = forwardRef<PDFHandle, PDFProps>(
  // eslint-disable-next-line max-statements
  (
    {
      fileUrl,
      highlights,
      onSelect = () => undefined,
      onDeselect,
      onScaleChange,
      onPageChange,
      onPdfReady,
      size,
    },
    ref
  ) => {
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

    useImperativeHandle(
      ref,
      () => ({
        goToPage(pageNumber: number) {
          const pageRef = { current: pageRefsMap.current[pageNumber.toString()] };
          animationFrameIdRef.current = triggerScroll(pageRef, animationFrameIdRef.current);
        },
        scrollToHighlight(highlightKey: string) {
          const highlightWrapper = pdfContainerRef.current?.querySelector(
            `[data-highlight-key="${highlightKey}"]`
          );
          const highlightRectangle = highlightWrapper?.querySelector('.highlight-rectangle');
          const elementToScroll = highlightRectangle || highlightWrapper;
          elementToScroll?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        },
        activateSnippet(snippet: Snippet) {
          const pageContainer = pageRefsMap.current[snippet.page.toString()];
          if (pageContainer) {
            highlightSnippetInPage(pageContainer, snippet);
            const firstMark = pageContainer.querySelector('mark');
            firstMark?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        deactivateSnippet() {
          Object.values(pageRefsMap.current).forEach(container => {
            if (container) clearSnippets(container);
          });
        },
      }),
      []
    );

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

    const padding = 0;
    const containerStyles = {
      height: size?.height || '100%',
      width: size?.width || '100%',
      overflow: size?.overflow || 'auto',
      paddingLeft: `${padding}px`,
      paddingRight: `${padding}px`,
    };

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

      const initialWidth = Math.max(
        0,
        (container.clientWidth || container.offsetWidth) - padding * 2 - 2
      );

      setContainerWidth(initialWidth);

      const resizeObserver = new ResizeObserver(entries => {
        const [entry] = entries;
        if (entry && entry.contentRect) {
          if (resizeTimeoutRef.current) {
            clearTimeout(resizeTimeoutRef.current);
          }

          resizeTimeoutRef.current = setTimeout(() => {
            const newWidth = Math.max(0, entry.contentRect.width - padding * 2 - 2);
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
        console.log(entries);
      };

      intersectionObserverRef.current = new IntersectionObserver(observerHandler, {
        rootMargin: '0px',
        threshold: 1.0,
      });
    }, []);

    if (error) {
      return <div>{error}</div>;
    }

    return (
      <HandleTextSelection onSelect={handleSelect} onDeselect={onDeselect}>
        <div id="pdf-container" ref={pdfContainerRef} style={containerStyles}>
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
  }
);

export type { PDFProps, Snippet, PDFHandle };
export { PDF };
