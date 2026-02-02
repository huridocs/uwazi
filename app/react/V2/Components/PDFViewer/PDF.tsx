import React, { useEffect, useRef, useState } from 'react';
import loadable from '@loadable/component';
import {
  SelectionRegion,
  HandleTextSelection,
  TextSelection,
} from '@huridocs/react-text-selection-handler';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { Translate } from '#app/I18N/index.js';
import { PDFJS, CMAP_URL, EventBus } from './pdfjs.js';
import { TextHighlight } from './types.js';
import { triggerScroll } from './functions/helpers.js';
import { pdfEventBus } from './events.js';
import { highlightSnippetInPage, clearSnippets } from './functions/snippetToHighlight.js';

const PDFPage = loadable(
  async () => (await import(/* webpackChunkName: "LazyLoadPDFPage" */ './PDFPage')).PDFPage
);

const eventBus = new EventBus();

interface PDFProps {
  fileUrl: string;
  highlights?: { [page: string]: TextHighlight[] };
  onSelect?: (selection: TextSelection) => any;
  onDeselect?: () => any;
  size?: { height?: string; width?: string; overflow?: string };
}

const getPDFFile = async (fileUrl: string) =>
  PDFJS.getDocument({
    url: fileUrl,
    cMapUrl: CMAP_URL,
    cMapPacked: true,
    isEvalSupported: false,
  }).promise;

const PDF = ({ fileUrl, highlights, onSelect = () => undefined, onDeselect, size }: PDFProps) => {
  const pageRefsMap = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const [pdf, setPDF] = useState<PDFDocumentProxy>();
  const [error, setError] = useState<string>();
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      let animationFrameId = 0;

      const onScrollToPageHandler = (pageNumber: number = 1) => {
        const pageRef = { current: pageRefsMap.current[pageNumber.toString()] };
        animationFrameId = triggerScroll(pageRef, animationFrameId);
      };

      const onActivateSnippetHandler = (snippet?: {
        text: string;
        page: number;
        filename?: string;
      }) => {
        if (snippet) {
          const pageContainer = pageRefsMap.current[snippet.page.toString()];

          if (pageContainer) {
            highlightSnippetInPage(pageContainer, snippet);

            const firstMark = pageContainer.querySelector('mark');

            if (firstMark) {
              firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      };

      const onDeactivateSnippetHandler = () => {
        Object.values(pageRefsMap.current).forEach(container => {
          if (container) {
            clearSnippets(container);
          }
        });
      };

      const onScrollToHighlightHandler = (highlightKey?: string) => {
        if (highlightKey) {
          const highlightWrapper = pdfContainerRef.current?.querySelector(
            `[data-highlight-key="${highlightKey}"]`
          );

          const highlightRectangle = highlightWrapper?.querySelector('.highlight-rectangle');
          const elementToScroll = highlightRectangle || highlightWrapper;

          elementToScroll?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      };

      const subscriptionGoToPage = pdfEventBus.on('goToPage', onScrollToPageHandler);

      const subscriptionActivateSnippet = pdfEventBus.on(
        'activateSnippet',
        onActivateSnippetHandler
      );

      const subscriptionDeactivateSnippet = pdfEventBus.on(
        'deactivateSnippet',
        onDeactivateSnippetHandler
      );

      const subscriptionScrollToHighlight = pdfEventBus.on(
        'scrollToHighlight',
        onScrollToHighlightHandler
      );

      pdfEventBus.dispatch('pdfReady');

      return () => {
        cancelAnimationFrame(animationFrameId);
        subscriptionGoToPage.unsubscribe();
        subscriptionActivateSnippet.unsubscribe();
        subscriptionDeactivateSnippet.unsubscribe();
        subscriptionScrollToHighlight.unsubscribe();
      };
    }

    return () => undefined;
  }, [pdf, containerWidth]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <HandleTextSelection onSelect={onSelect} onDeselect={onDeselect}>
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
                    eventBus={eventBus}
                    highlights={pageHighlights}
                    containerWidth={containerWidth}
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

export type { PDFProps };
export { PDF };
