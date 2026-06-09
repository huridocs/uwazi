import React, { useEffect, useRef, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { PDF, PDFControls, referenceToHighlight } from '#V2/Components/PDFViewer/index.js';
import { ReferencesDisplay } from '#V2/Components/References/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { apiEntity, translations, templates } from '../fixtures/referencesFixtures.js';

const ReferencesDisplayComponent = ({
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
              <Translate>References</Translate>
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
              <ReferencesDisplay
                entity={apiEntity}
                document={apiEntity.documents![0]}
                currentPage={currentPage}
                pageHeight={pageHeight}
                showRail={!isMobile}
                onPointClick={reference => {
                  const highlight = referenceToHighlight(reference);
                  if (highlight) {
                    documentControls.current?.toggleHighlights([highlight]);
                  }
                }}
                onClusterClick={references => {
                  const page = Number(
                    references?.[0].reference.selectionRectangles?.[0].page || '0'
                  );
                  if (page !== currentClusterPage) {
                    setCurrentClusterPage(page);
                    documentControls.current?.goToPage(
                      Number(references?.[0].reference.selectionRectangles?.[0].page || '0')
                    );
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

const meta: Meta<typeof ReferencesDisplayComponent> = {
  title: 'EntityViewer/ReferencesDisplay',
  component: ReferencesDisplayComponent,
};

type Story = StoryObj<typeof ReferencesDisplayComponent>;

const Primary: Story = {
  render: args => <ReferencesDisplayComponent locale={args.locale} fileUrl={args.fileUrl} />,
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
