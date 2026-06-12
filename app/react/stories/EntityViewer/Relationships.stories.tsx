import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BrowserRouter } from 'react-router';
import { createStore, Provider } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom, templatesAtom, translationsAtom } from '#V2/atoms/index.js';
import { PDF, PDFControls, relationshipToHighlight } from '#V2/Components/PDFViewer/index.js';
import { RelationshipsDisplay } from '#V2/Components/Relationships/index.js';
import { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { apiEntity, translations, templates } from '../fixtures/referencesFixtures.js';

type RelationshipsDisplayStoryProps = {
  locale: 'en' | 'es';
  fileUrl?: string;
  activeRelationshipId?: string | null;
  onPointClick?: (marker: RelationshipMarker) => void;
  onClusterClick?: (markers: RelationshipMarker[]) => void;
};

const RelationshipsDisplayComponent = ({
  locale,
  fileUrl = '/sample.pdf',
  activeRelationshipId = null,
  onPointClick,
  onClusterClick,
}: RelationshipsDisplayStoryProps) => {
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

  const defaultOnPointClick = useCallback((marker: RelationshipMarker) => {
    const color = templates.find(t => t._id === marker.target.templateId)?.color;
    const highlight = relationshipToHighlight(marker.anchor, color);
    if (highlight) {
      documentControls.current?.toggleHighlights([highlight]);
    }
  }, []);

  const defaultOnClusterClick = useCallback(
    (markers: RelationshipMarker[]) => {
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
    },
    [currentClusterPage]
  );

  const handlePointClick = useCallback(
    (marker: RelationshipMarker) => {
      onPointClick?.(marker);
      defaultOnPointClick(marker);
    },
    [defaultOnPointClick, onPointClick]
  );

  const handleClusterClick = useCallback(
    (markers: RelationshipMarker[]) => {
      onClusterClick?.(markers);
      defaultOnClusterClick(markers);
    },
    [defaultOnClusterClick, onClusterClick]
  );

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
                activeRelationshipId={activeRelationshipId}
                onPointClick={handlePointClick}
                onClusterClick={handleClusterClick}
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
  args: {
    locale: 'en',
    activeRelationshipId: null,
    onPointClick: fn(),
    onClusterClick: fn(),
  },
  argTypes: {
    onPointClick: { action: 'point-clicked' },
    onClusterClick: { action: 'cluster-clicked' },
    activeRelationshipId: { control: 'text' },
  },
};

type Story = StoryObj<typeof RelationshipsDisplayComponent>;

const Primary: Story = {
  render: args => <RelationshipsDisplayComponent {...args} />,
};

const Basic: Story = {
  ...Primary,
  args: {
    fileUrl: undefined,
  },
};

const waitForRail = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await canvas.findByTestId('rail-marker-cluster', {}, { timeout: 20000 });
  return canvas;
};

const ClusterClick: Story = {
  ...Primary,
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForRail(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: '25' }));
    await expect(args.onClusterClick).toHaveBeenCalledOnce();
    await expect(canvas.getByTestId('cluster-subtree')).toBeInTheDocument();
  },
};

const PointInClusterClick: Story = {
  ...Primary,
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForRail(canvasElement);
    await userEvent.click(await canvas.findByRole('button', { name: '25' }));
    await userEvent.click(await canvas.findByRole('button', { name: 'Person 1' }));
    await expect(args.onPointClick).toHaveBeenCalledOnce();
    await expect(args.onPointClick).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ title: 'Person 1' }),
      })
    );
    await expect(canvasElement.querySelector('div[data-highlight-key]')).not.toBeNull();
  },
};

const StandalonePointClick: Story = {
  ...Primary,
  play: async ({ canvasElement, args }) => {
    const canvas = await waitForRail(canvasElement);
    const standaloneMarkers = (await canvas.findAllByTestId('rail-marker')).filter(
      element =>
        !element.closest('[data-testid="rail-marker-cluster"]') &&
        element.textContent?.includes('Person 2')
    );
    await userEvent.click(standaloneMarkers[standaloneMarkers.length - 1]);
    await expect(args.onPointClick).toHaveBeenCalledOnce();
    await expect(args.onPointClick).toHaveBeenCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ title: 'Person 2' }),
      })
    );
  },
};

export default meta;
export { Basic, ClusterClick, PointInClusterClick, StandalonePointClick };
export type { RelationshipsDisplayStoryProps };
