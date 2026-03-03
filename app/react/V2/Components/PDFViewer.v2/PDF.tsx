import React, { useEffect, useRef, useState } from 'react';
import { HandleTextSelection, TextSelection } from '@huridocs/react-text-selection-handler';
import { getDocument, PDFDocumentProxy, PDFDocumentLoadingTask } from 'pdfjs-dist/webpack.mjs';
import { EventBus, PDFLinkService, PDFViewer } from 'pdfjs-dist/web/pdf_viewer.mjs';
import 'pdfjs-dist/web/pdf_viewer.css';

const TEXT_LAYER_MODE = 1;
const CMAP_URL = 'legacy_character_maps/';
const CMAP_PACKED = true;
const noop = () => undefined;

type PDFEventBus = InstanceType<typeof EventBus>;

type PDFProps = {
  fileUrl: string;
  className?: string;
  onSelect?: (selection: TextSelection) => void;
  onDeselect?: () => void;
  onDocumentLoaded?: (pdfDocument: PDFDocumentProxy, eventBus: PDFEventBus) => void;
  onPageRendered?: (pageNumber: number) => void;
  onPageChanged?: (pageNumber: number, previousPageNumber: number) => void;
  onEventBusReady?: (eventBus: PDFEventBus) => void;
};

const PDF = ({
  fileUrl,
  className,
  onSelect,
  onDeselect,
  onDocumentLoaded,
  onPageRendered,
  onPageChanged,
  onEventBusReady,
}: PDFProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const eventBusRef = useRef<PDFEventBus | null>(null);
  const pdfViewerRef = useRef<PDFViewer | null>(null);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const viewer = viewerRef.current;

    if (!container || !viewer) {
      return undefined;
    }

    const eventBus = new EventBus();
    const linkService = new PDFLinkService({ eventBus });
    const pdfViewer = new PDFViewer({
      container,
      viewer,
      eventBus,
      linkService,
      textLayerMode: TEXT_LAYER_MODE,
    });

    linkService.setViewer(pdfViewer);

    eventBusRef.current = eventBus;
    pdfViewerRef.current = pdfViewer;
    onEventBusReady?.(eventBus);

    const onPageRenderedInternal = (event: { pageNumber: number }) => {
      const pageElement = viewerRef.current?.querySelector(
        `.page[data-page-number="${event.pageNumber}"]`
      );

      pageElement?.setAttribute('data-region-selector-id', event.pageNumber.toString());
      onPageRendered?.(event.pageNumber);
    };

    const onPageChangedInternal = (event: { pageNumber: number; previous: number }) => {
      onPageChanged?.(event.pageNumber, event.previous);
    };

    eventBus.on('pagerendered', onPageRenderedInternal);
    eventBus.on('pagechanging', onPageChangedInternal);

    return () => {
      eventBus.off('pagerendered', onPageRenderedInternal);
      eventBus.off('pagechanging', onPageChangedInternal);
      eventBusRef.current = null;
      pdfViewerRef.current = null;
    };
  }, [onEventBusReady, onPageChanged, onPageRendered]);

  useEffect(() => {
    const eventBus = eventBusRef.current;
    const pdfViewer = pdfViewerRef.current;

    if (!eventBus || !pdfViewer || !fileUrl) {
      return undefined;
    }

    setError(null);

    const previousTask = loadingTaskRef.current;

    if (previousTask) {
      previousTask.destroy().catch(e => {
        setError(e.message);
      });
    }

    const loadingTask = getDocument({
      url: fileUrl,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
      isEvalSupported: false,
    });

    loadingTaskRef.current = loadingTask;

    loadingTask.promise
      .then(pdfDocument => {
        if (loadingTaskRef.current !== loadingTask) {
          return;
        }

        pdfViewer.setDocument(pdfDocument);
        pdfViewer.currentScaleValue = 'page-width';

        // eventBus.dispatch('documentloaded', {
        //   source: pdfViewer,
        //   pdfDocument,
        // });

        if (onDocumentLoaded) {
          onDocumentLoaded(pdfDocument, eventBus);
        }
      })
      .catch((loadError: Error) => {
        if (loadingTaskRef.current !== loadingTask) {
          return;
        }

        setError(loadError.message);
      });

    return () => {
      if (loadingTaskRef.current === loadingTask) {
        loadingTask.destroy().catch(() => undefined);
        loadingTaskRef.current = null;
      }
    };
  }, [fileUrl, onDocumentLoaded]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <HandleTextSelection onSelect={onSelect || noop} onDeselect={onDeselect || noop}>
      <div style={{ position: 'relative' }} className={className}>
        <div ref={containerRef} style={{ position: 'absolute' }}>
          <div ref={viewerRef} className="pdfViewer" />
        </div>
      </div>
    </HandleTextSelection>
  );
};

export { PDF, type PDFProps, type PDFEventBus };
