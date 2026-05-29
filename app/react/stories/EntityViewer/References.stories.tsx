import React, { useRef, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { PDF, PDFControls, referenceToHighlight } from '#V2/Components/PDFViewer/index.js';
import { ReferencesDisplay } from '#V2/Components/References/index.js';
import { apiEntity, translations, templates } from '../fixtures/referencesFixtures.js';

const ReferencesDisplayComponent = ({ locale }: { locale: 'en' | 'es' }) => {
  const store = createStore();
  store.set(templatesAtom, templates);
  store.set(localeAtom, locale);
  store.set(translationsAtom, translations);
  const documentControls = useRef<PDFControls>();
  const [currentPage, setCurrentPage] = useState(1);
  const [activeReferenceId, setActiveReferenceId] = useState<string | null>(null);
  const [currentClusterPage, setCurrentClusterPage] = useState<number | null>(null);

  return (
    <div className="h-screen max-h-200 bg-(--color-theme-surface-raised)">
      <BrowserRouter>
        <Provider store={store}>
          <div className="flex flex-col gap-4 w-full h-full text-ink">
            <div>
              <Translate>References</Translate>
              <p>
                <Translate>Current page</Translate>: {currentPage}
              </p>
            </div>
            <div className="flex flex-row gap-4 flex-1 overflow-hidden min-h-0">
              <div className="w-5/6 overflow-y-auto">
                <PDF
                  fileUrl="/sample.pdf"
                  onPdfReady={controls => {
                    documentControls.current = controls;
                  }}
                  onPageChange={page => {
                    setCurrentPage(page);
                  }}
                />
              </div>
              <div className="w-1/6">
                <ReferencesDisplay
                  entity={apiEntity}
                  document={apiEntity.documents![0]}
                  currentPage={currentPage}
                  onPointClick={reference => {
                    setActiveReferenceId(reference._id);
                    const highligh = referenceToHighlight(reference);
                    if (highligh) {
                      documentControls.current?.toggleHighlights([highligh]);
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
                      setActiveReferenceId(null);
                      documentControls.current?.toggleHighlights([]);
                    }
                  }}
                />
              </div>
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
  render: args => <ReferencesDisplayComponent locale={args.locale} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    locale: 'en',
  },
};

export default meta;
export { Basic };
