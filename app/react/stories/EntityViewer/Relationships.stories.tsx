import React, { useEffect, useRef, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { PDF, PDFControls, relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { apiEntity, translations, templates } from '../fixtures/referencesFixtures.js';

const RelationshipsDisplayComponent = ({
  locale,
  fileUrl = '/sample.pdf',
}: {
  locale: 'en' | 'es';
  fileUrl?: string;
}) => {
  const store = createStore();
  store.set(templatesAtom, templates);
  store.set(localeAtom, locale);
  store.set(translationsAtom, translations);
  const documentControls = useRef<PDFControls>();
  const [currentPage, setCurrentPage] = useState(1);
  const [currentClusterPage, setCurrentClusterPage] = useState<number | null>(null);
  const [pageHeight, setPageHeight] = useState<number | undefined>();
  const [pdfScrollRoot, setPdfScrollRoot] = useState<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const pageNumber = currentPage.toString();
    const pageElement = document.querySelector<HTMLDivElement>(
      `.page[data-page-number="${pageNumber}"]`
    );

    if (!pageElement) {
      setPageHeight(undefined);
      return undefined;
    }

    const updateHeight = () => {
      const { height } = pageElement.getBoundingClientRect();
      setPageHeight(height > 0 ? height : undefined);
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(pageElement);

    return () => {
      observer.disconnect();
    };
  }, [currentPage]);

  return (
    <div className="h-screen max-h-200 bg-(--color-theme-surface-raised)">
      <BrowserRouter>
        <Provider store={store}>
          <div className="flex h-full w-full flex-col gap-(--spacing-theme-3) p-4 text-ink">
            <div>
              <Translate>Relationships</Translate>
              <p>
                <Translate>Current page</Translate>: {currentPage}
              </p>
            </div>
            <div
              data-testid="document-container"
              className="relative min-h-0 flex-1 rounded-md bg-(--color-theme-surface-warm)"
            >
              <div
                ref={setPdfScrollRoot}
                data-testid="pdf-scroll-container"
                className="absolute inset-0 overflow-y-auto"
              >
                <PDF
                  fileUrl={fileUrl}
                  size={{ height: '100%', width: '90%' }}
                  scrollRoot={pdfScrollRoot}
                  onPdfReady={controls => {
                    documentControls.current = controls;
                  }}
                  onPageChange={page => {
                    setCurrentPage(page);
                  }}
                />
              </div>
              <RelationshipsDisplay
                entity={apiEntity}
                document={apiEntity.documents![0]}
                currentPage={currentPage}
                pageHeight={pageHeight}
                showRail={!isMobile}
                onPointClick={marker => {
                  const color = templates.find(t => t._id === marker.target.templateId)?.color;
                  const highlight = relationshipToHighlight(marker.anchor, color);
                  if (highlight) {
                    documentControls.current?.toggleHighlights([highlight]);
                  }
                }}
                onClusterClick={markers => {
                  const page = markers?.[0]?.anchor?.selections?.[0]?.page;
                  if (!page) {
                    documentControls.current?.toggleHighlights([]);
                    return;
                  }
                  if (page !== currentClusterPage) {
                    setCurrentClusterPage(page);
                    documentControls.current?.goToPage(page);
                  } else {
                    documentControls.current?.toggleHighlights([]);
                  }
                }}
              />
            </div>
          </div>
        </Provider>
      </BrowserRouter>
    </div>
  );
};

const meta: Meta<typeof RelationshipsDisplayComponent> = {
  title: 'EntityViewer/RelationshipsDisplay',
  component: RelationshipsDisplayComponent,
};

type Story = StoryObj<typeof RelationshipsDisplayComponent>;

const Primary: Story = {
  render: args => <RelationshipsDisplayComponent locale={args.locale} fileUrl={args.fileUrl} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    locale: 'en',
    fileUrl: undefined,
  },
};

export default meta;
export { Basic };
