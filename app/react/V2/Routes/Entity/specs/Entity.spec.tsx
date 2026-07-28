/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Entity as EntityType } from '#V2/api/entities/types.js';
import {
  TestAtomStoreProvider,
  TestRouterContext,
  setupMatchMediaMock,
} from '#V2/testing/index.js';
import { createTestServices } from '#V2/testing/createTestServices.js';
import { ServicesProvider } from '#V2/services/ServicesProvider.js';
import { settingsAtom, templatesAtom, userAtom } from '#V2/atoms/index.js';
import * as utils from '#app/utils/index.js';
import * as files from '#V2/api/files/index.js';
import * as searchApi from '#V2/api/search/index.js';
import { Entity } from '../Entity.js';
import { entityLoaderCache } from '../EntityLoaderCache.js';

jest.mock('#V2/Components/PDFViewer', () => ({
  ...jest.requireActual('#V2/Components/PDFViewer'),
  PDF: ({ fileUrl }: any) => (
    <div data-testid="mock-pdf">
      PDF: {fileUrl}
      <div className="page" data-page-number="1" style={{ height: 800 }} />
    </div>
  ),
}));

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();

  constructor(_callback: ResizeObserverCallback) {}
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const sampleEntity: Partial<EntityType> = {
  _id: 'ent1',
  sharedId: 'shared1',
  language: 'en',
  title: 'Sample Entity',
  template: 'template1',
  documents: [{ filename: 'file.pdf', _id: '1', language: 'eng' }],
  metadata: {},
};

const sampleMainDocument = sampleEntity.documents![0];

const sampleTemplate = [
  { _id: 'template1', name: 'Template 1', properties: [], commonProperties: [] },
];

let mediaMock = setupMatchMediaMock();

const checkEntityRendered = async () => {
  const titleElements = await screen.findAllByText('Sample Entity');
  expect(titleElements.length).toBeGreaterThan(0);
};

const relationshipsSideTab = /^Relationships/;
const relationshipsMainTab = /^Relationships/;

const selectPlainTextView = (container?: HTMLElement) => {
  const scope = container ? within(container) : screen;
  fireEvent.click(scope.getByRole('button', { name: 'View' }));
  fireEvent.click(scope.getByRole('menuitem', { name: 'Plain text' }));
};

describe('Entity view', () => {
  afterEach(() => {
    jest.clearAllMocks();
    entityLoaderCache.invalidateAll();
    mediaMock.restore();
    mediaMock = setupMatchMediaMock();
  });

  it('should show loading when no entity', async () => {
    render(
      <TestRouterContext loaderData={undefined}>
        <Entity />
      </TestRouterContext>
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should render PDF and metadata', async () => {
    render(
      <TestRouterContext
        loaderData={{ entity: sampleEntity, mainDocument: sampleMainDocument, pagePlaintext: '' }}
      >
        <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
          <Entity />
        </TestAtomStoreProvider>
      </TestRouterContext>
    );

    await checkEntityRendered();

    const pdf = await screen.findByTestId('mock-pdf');
    expect(pdf).toBeInTheDocument();
    expect(pdf).toHaveTextContent('/api/files/file.pdf');
  });

  describe('OCR service', () => {
    beforeAll(() => {
      jest.spyOn(files, 'getOcrStatus').mockResolvedValue({ status: files.OcrStatus.NONE });
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should not display the OCR button when the service is not availabe', async () => {
      render(
        <TestRouterContext
          loaderData={{
            entity: { ...sampleEntity },
            mainDocument: sampleMainDocument,
            pagePlaintext: '',
          }}
        >
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, sampleTemplate],
              [settingsAtom, {}],
              [userAtom, { _id: '1', role: 'admin', name: 'admin' }],
            ]}
          >
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      expect(screen.queryByText('OCR PDF')).not.toBeInTheDocument();
    });

    it('should not display if there is no user', async () => {
      render(
        <TestRouterContext
          loaderData={{
            entity: { ...sampleEntity },
            mainDocument: sampleMainDocument,
            pagePlaintext: '',
          }}
        >
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, sampleTemplate],
              [settingsAtom, { ocrServiceEnabled: true }],
            ]}
          >
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      expect(screen.queryByText('OCR PDF')).not.toBeInTheDocument();
    });
  });

  describe('Tabs', () => {
    beforeEach(async () => {
      render(
        <TestRouterContext
          loaderData={{ entity: sampleEntity, mainDocument: sampleMainDocument, pagePlaintext: '' }}
        >
          <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();
    });

    it('should render the expected main tabs', () => {
      const tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);
      expect(mainTabs.getByRole('tab', { name: 'Document' })).toBeInTheDocument();
      expect(mainTabs.getByRole('tab', { name: 'Document' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(mainTabs.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
      expect(mainTabs.getByRole('tab', { name: relationshipsMainTab })).toBeInTheDocument();
      expect(mainTabs.getByRole('tab', { name: /Files/ })).toBeInTheDocument();
    });

    it('should render files side panel tabs when Files is selected', async () => {
      const tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);
      fireEvent.click(mainTabs.getByRole('tab', { name: /Files/ }));

      await waitFor(() => {
        const refreshedTablists = screen.getAllByTestId('tabs-comp');
        const sideTabs = within(refreshedTablists[1]);
        expect(sideTabs.getByRole('tab', { name: 'File' })).toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'Translations 1' })).toBeInTheDocument();
      });
    });

    it('should render the expected side tabs', () => {
      const tablists = screen.getAllByTestId('tabs-comp');
      const sideTabs = within(tablists[1]);

      expect(sideTabs.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
      expect(sideTabs.getByRole('tab', { name: 'ToC' })).toBeInTheDocument();
      expect(sideTabs.getByRole('tab', { name: relationshipsSideTab })).toBeInTheDocument();
      expect(sideTabs.getByRole('tab', { name: 'Search' })).toBeInTheDocument();
    });

    it('should update the side tabs when switching main tabs', async () => {
      let tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);

      const metadataMainTab = mainTabs.getByRole('tab', { name: 'Metadata' });
      const relsMainTab = mainTabs.getByRole('tab', { name: relationshipsMainTab });

      fireEvent.click(metadataMainTab);

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        const sideTabs = within(tablists[1]);
        expect(sideTabs.getByRole('tab', { name: 'Document' })).toBeInTheDocument();
        expect(sideTabs.queryByRole('tab', { name: 'Metadata' })).not.toBeInTheDocument();
        expect(sideTabs.queryByRole('tab', { name: 'ToC' })).not.toBeInTheDocument();
        expect(sideTabs.queryByRole('tab', { name: 'References' })).not.toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: relationshipsSideTab })).toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'Search' })).toBeInTheDocument();
      });

      fireEvent.click(relsMainTab);

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        const sideTabs = within(tablists[1]);
        expect(sideTabs.getByRole('tab', { name: 'Document' })).toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'ToC' })).toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'Search' })).toBeInTheDocument();
        expect(sideTabs.queryByRole('tab', { name: relationshipsSideTab })).not.toBeInTheDocument();
      });
    });

    it('should hide the entity header when Document is shown in the side panel', async () => {
      let tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);

      fireEvent.click(mainTabs.getByRole('tab', { name: 'Metadata' }));

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        expect(within(tablists[1]).getByRole('tab', { name: 'Document' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });

      const sideDocumentPanel = document.getElementById('entity-side-panel-document');
      expect(sideDocumentPanel).not.toBeNull();
      expect(within(sideDocumentPanel as HTMLElement).queryByText('Sample Entity')).toBeNull();
      expect(
        within(sideDocumentPanel as HTMLElement).getByRole('button', { name: 'View' })
      ).toBeInTheDocument();
      expect(within(sideDocumentPanel as HTMLElement).getByTestId('mock-pdf')).toBeInTheDocument();
    });

    it('should preserve active side tab when switching to a main tab that supports it', async () => {
      let tablists = screen.getAllByTestId('tabs-comp');
      let mainTabs = within(tablists[0]);
      let sideTabs = within(tablists[1]);

      const relsSideTab = sideTabs.getByRole('tab', { name: relationshipsSideTab });
      fireEvent.click(relsSideTab);

      await waitFor(() => {
        expect(sideTabs.getByRole('tab', { name: relationshipsSideTab })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });

      const metadataMainTab = mainTabs.getByRole('tab', { name: 'Metadata' });
      fireEvent.click(metadataMainTab);

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        mainTabs = within(tablists[0]);
        sideTabs = within(tablists[1]);

        expect(mainTabs.getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
          'aria-selected',
          'true'
        );

        expect(sideTabs.getByRole('tab', { name: relationshipsSideTab })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });

    it('should reset side tab when switching main tab drops an unsupported side id', async () => {
      let tablists = screen.getAllByTestId('tabs-comp');
      let mainTabs = within(tablists[0]);
      let sideTabs = within(tablists[1]);

      expect(mainTabs.getByRole('tab', { name: 'Document' })).toHaveAttribute(
        'aria-selected',
        'true'
      );

      fireEvent.click(sideTabs.getByRole('tab', { name: 'ToC' }));

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        sideTabs = within(tablists[1]);
        expect(sideTabs.getByRole('tab', { name: 'ToC' })).toHaveAttribute('aria-selected', 'true');
      });

      mainTabs = within(screen.getAllByTestId('tabs-comp')[0]);
      const metadataMainTab = mainTabs.getByRole('tab', { name: 'Metadata' });
      fireEvent.click(metadataMainTab);

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        mainTabs = within(tablists[0]);
        sideTabs = within(tablists[1]);

        expect(mainTabs.getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
          'aria-selected',
          'true'
        );

        expect(sideTabs.queryByRole('tab', { name: 'ToC' })).not.toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'Document' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });
  });

  describe('metadata editing session', () => {
    it('keeps dirty draft when editing on side then opening main Metadata', async () => {
      render(
        <TestRouterContext
          loaderData={{
            entity: sampleEntity,
            mainDocument: sampleMainDocument,
            pagePlaintext: '',
          }}
        >
          <ServicesProvider value={createTestServices()}>
            <TestAtomStoreProvider
              initialValues={[
                [templatesAtom, sampleTemplate],
                [userAtom, { _id: '1', role: 'admin', name: 'admin' }],
              ]}
            >
              <Entity />
            </TestAtomStoreProvider>
          </ServicesProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      let tablists = screen.getAllByTestId('tabs-comp');
      const sideTabs = within(tablists[1]);
      fireEvent.click(sideTabs.getByRole('tab', { name: 'Metadata' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

      const titleInput = await screen.findByRole('textbox', { name: /Title/ });
      fireEvent.change(titleInput, { target: { value: 'Dirty from side' } });
      expect(titleInput).toHaveValue('Dirty from side');

      tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);
      fireEvent.click(mainTabs.getByRole('tab', { name: 'Metadata' }));

      await waitFor(() => {
        expect(screen.getByTestId('entity-edit-form')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: /Title/ })).toHaveValue('Dirty from side');
        expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      });

      const metadataTab = within(screen.getAllByTestId('tabs-comp')[0]).getByRole('tab', {
        name: /Metadata/,
      });
      expect(within(metadataTab).getByTestId('accent-dot')).toBeInTheDocument();
    });
  });

  describe('Plain text view', () => {
    const pageText = 'This is the plain text';

    beforeAll(() => {
      jest.spyOn(files, 'getDocumentPlaintext').mockResolvedValue(pageText);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should switch to plain text view', async () => {
      render(
        <TestRouterContext
          loaderData={{
            entity: { ...sampleEntity },
            mainDocument: sampleMainDocument,
            pagePlaintext: pageText,
          }}
        >
          <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      expect(screen.getByTestId('mock-pdf')).toBeInTheDocument();

      expect(
        screen.getByText('This is the plain text').closest('.overflow-auto')?.classList
      ).toContain('hidden');

      selectPlainTextView();

      await waitFor(() => {
        expect(screen.getByText(pageText).closest('.overflow-auto')?.classList).toContain('block');
        expect(screen.getByRole('region', { name: 'Page 1' })).toHaveAttribute('id', 'page1');
      });
    });

    it('should render the plain text view on SSR', async () => {
      jest.replaceProperty(utils, 'isClient', false);

      render(
        <TestRouterContext
          loaderData={{
            entity: { ...sampleEntity },
            mainDocument: sampleMainDocument,
            pagePlaintext: pageText,
          }}
        >
          <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      await waitFor(() => {
        expect(screen.getByText(pageText).closest('.overflow-auto')?.classList).toContain('block');
      });

      jest.restoreAllMocks();
    });
  });

  describe('Entity without mainDocument', () => {
    it('does not render Document tab and defaults to Metadata', async () => {
      const entityNoDoc = { ...sampleEntity, documents: undefined } as any;

      render(
        <TestRouterContext
          loaderData={{ entity: entityNoDoc, mainDocument: undefined, pagePlaintext: '' }}
        >
          <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      const tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);

      expect(mainTabs.queryByRole('tab', { name: 'Document' })).not.toBeInTheDocument();
      expect(mainTabs.getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
    });

    it('should render the Files tab when the entity has no files', async () => {
      const entityNoFiles = {
        ...sampleEntity,
        documents: [],
        attachments: [],
      } as EntityType;

      render(
        <TestRouterContext
          loaderData={{ entity: entityNoFiles, mainDocument: undefined, pagePlaintext: '' }}
        >
          <TestAtomStoreProvider
            initialValues={[
              [templatesAtom, sampleTemplate],
              [userAtom, { _id: '1', role: 'admin', name: 'admin' }],
            ]}
          >
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      const tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);
      expect(mainTabs.getByRole('tab', { name: /Files/ })).toBeInTheDocument();

      fireEvent.click(mainTabs.getByRole('tab', { name: /Files/ }));

      await waitFor(() => {
        expect(mainTabs.getByRole('tab', { name: /Files/ })).toHaveAttribute(
          'aria-selected',
          'true'
        );
        expect(screen.getByRole('button', { name: /Add file/ })).toBeInTheDocument();
      });
    });
  });

  describe('search tab', () => {
    it('should be shown by default when there is a search in the URL', async () => {
      render(
        <TestRouterContext
          loaderData={{ entity: sampleEntity, pagePlaintext: '' }}
          initialEntries={['/#s=search&searchTerm=term']}
        >
          <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('term');
    });

    it('should show seach results', async () => {
      const snippetsData = {
        data: [
          {
            _id: 's1',
            snippets: {
              count: 2,
              metadata: [{ field: 'title', texts: ['<b>Match title</b>'] }],
              fullText: [{ page: 3, text: 'Excerpt <b>match</b>' }],
            },
          },
        ],
      };
      entityLoaderCache.setSearchResults('shared1', 'en:1', 'search', snippetsData);
      jest.spyOn(searchApi, 'snippets').mockResolvedValue(snippetsData);

      render(
        <TestRouterContext
          loaderData={{
            entity: sampleEntity,
            mainDocument: sampleMainDocument,
            pagePlaintext: '',
          }}
          initialEntries={['/#s=search&searchTerm=search']}
        >
          <TestAtomStoreProvider initialValues={[[templatesAtom, sampleTemplate]]}>
            <Entity />
          </TestAtomStoreProvider>
        </TestRouterContext>
      );

      await checkEntityRendered();

      expect(await screen.findByText('Match title')).toBeInTheDocument();
      expect(screen.getByText('Page 3')).toBeInTheDocument();
    });
  });
});
