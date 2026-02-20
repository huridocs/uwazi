/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Entity as EntityType } from 'V2/domain/entities/Entity';
import { TestAtomStoreProvider, TestRouterContext, setupMatchMediaMock } from 'V2/testing';
import { settingsAtom, userAtom } from 'V2/atoms';
import * as utils from 'app/utils';
import * as files from 'V2/api/files';
import { Entity } from '../Entity';

jest.mock('V2/Components/PDFViewer', () => ({
  ...jest.requireActual('V2/Components/PDFViewer'),
  PDF: ({ fileUrl }: any) => <div data-testid="mock-pdf">PDF: {fileUrl}</div>,
}));

const mockGoToPage = jest.fn();
const mockActivateSnippet = jest.fn();
jest.mock('../Components/PdfControllerContext', () => ({
  ...jest.requireActual('../Components/PdfControllerContext'),
  createPdfController: () => ({
    goToPage: mockGoToPage,
    scrollToHighlight: jest.fn(),
    activateSnippet: mockActivateSnippet,
    deactivateSnippet: jest.fn(),
    scrollToSnippet: jest.fn((snippet: { page: number }, currentPage: number) => {
      if (currentPage !== snippet.page) mockGoToPage(snippet.page);
      setTimeout(() => mockActivateSnippet(snippet), 200);
    }),
  }),
}));

const sampleEntity: Partial<EntityType> = {
  _id: 'ent1',
  sharedId: 'shared1',
  title: 'Sample Entity',
  template: { _id: 'template1', label: 'Template 1', name: 'template1' },
  mainDocument: [{ filename: 'file.pdf' }],
  metadata: [],
};

const mainDocumentFile = { filename: 'file.pdf' };

let mediaMock = setupMatchMediaMock();

const checkEntityRendered = async () => {
  const titleElements = await screen.findAllByText('Sample Entity');
  expect(titleElements.length).toBeGreaterThan(0);
};

describe('Entity view', () => {
  afterEach(() => {
    jest.clearAllMocks();
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
      <TestRouterContext loaderData={{ entity: sampleEntity, pagePlaintext: '' }}>
        <Entity />
      </TestRouterContext>
    );

    await checkEntityRendered();

    expect(screen.getByTestId('mock-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('mock-pdf')).toHaveTextContent('/api/files/file.pdf');
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
            entity: { ...sampleEntity, mainDocument: [mainDocumentFile] },
            pagePlaintext: '',
          }}
        >
          <TestAtomStoreProvider
            initialValues={[
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
            entity: { ...sampleEntity, mainDocument: [mainDocumentFile] },
            pagePlaintext: '',
          }}
        >
          <TestAtomStoreProvider initialValues={[[settingsAtom, { ocrServiceEnabled: true }]]}>
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
        <TestRouterContext loaderData={{ entity: sampleEntity, pagePlaintext: '' }}>
          <Entity />
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
      expect(mainTabs.getByRole('tab', { name: 'Relationships' })).toBeInTheDocument();
    });

    it('should render the expected side tabs', () => {
      const tablists = screen.getAllByTestId('tabs-comp');
      const sideTabs = within(tablists[1]);

      expect(sideTabs.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
      expect(sideTabs.getByRole('tab', { name: 'Relationships' })).toBeInTheDocument();
    });

    it('should update the side tabs when switching main tabs', async () => {
      let tablists = screen.getAllByTestId('tabs-comp');
      const mainTabs = within(tablists[0]);

      const metadataMainTab = mainTabs.getByRole('tab', { name: 'Metadata' });
      const relsMainTab = mainTabs.getByRole('tab', { name: 'Relationships' });

      fireEvent.click(metadataMainTab);

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        const sideTabs = within(tablists[1]);
        expect(sideTabs.queryByRole('tab', { name: 'Metadata' })).not.toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'Relationships' })).toBeInTheDocument();
      });

      fireEvent.click(relsMainTab);

      await waitFor(() => {
        tablists = screen.getAllByTestId('tabs-comp');
        const sideTabs = within(tablists[1]);
        expect(sideTabs.getByRole('tab', { name: 'Metadata' })).toBeInTheDocument();
        expect(sideTabs.queryByRole('tab', { name: 'Relationships' })).not.toBeInTheDocument();
      });
    });

    it('should preserve active side tab when switching to a main tab that supports it', async () => {
      render(
        <TestRouterContext loaderData={{ entity: sampleEntity, pagePlaintext: '' }}>
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      let tablists = screen.getAllByTestId('tabs-comp');
      let mainTabs = within(tablists[0]);
      let sideTabs = within(tablists[1]);

      const relsSideTab = sideTabs.getByRole('tab', { name: 'Relationships' });
      fireEvent.click(relsSideTab);

      await waitFor(() => {
        expect(sideTabs.getByRole('tab', { name: 'Relationships' })).toHaveAttribute(
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

        expect(sideTabs.getByRole('tab', { name: 'Relationships' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });

    it('should clear side tab when switching to a main tab that does not support it', async () => {
      render(
        <TestRouterContext
          loaderData={{ entity: sampleEntity, pagePlaintext: '' }}
          initialEntries={['/?main=document&side=metadata']}
        >
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      let tablists = screen.getAllByTestId('tabs-comp');
      let mainTabs = within(tablists[0]);
      let sideTabs = within(tablists[1]);

      expect(mainTabs.getByRole('tab', { name: 'Document' })).toHaveAttribute(
        'aria-selected',
        'true'
      );
      expect(sideTabs.getByRole('tab', { name: 'Metadata' })).toHaveAttribute(
        'aria-selected',
        'true'
      );

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

        expect(sideTabs.queryByRole('tab', { name: 'Metadata' })).not.toBeInTheDocument();
        expect(sideTabs.getByRole('tab', { name: 'Relationships' })).toHaveAttribute(
          'aria-selected',
          'true'
        );
      });
    });
  });

  describe('Plain text view', () => {
    const pageText = 'This is the plain text';

    beforeAll(() => {
      jest.spyOn(files, 'getPagePlaintext').mockResolvedValue(pageText);
    });

    afterAll(() => {
      jest.clearAllMocks();
    });

    it('should switch to plain text view', async () => {
      render(
        <TestRouterContext
          loaderData={{
            entity: { ...sampleEntity, mainDocument: [mainDocumentFile] },
            pagePlaintext: pageText,
          }}
        >
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      expect(screen.getByTestId('mock-pdf')).toBeInTheDocument();

      expect(screen.getByText('This is the plain text').parentElement?.classList).toContain(
        'hidden'
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'raw' } });

      await waitFor(() => {
        expect(screen.getByText(pageText).parentElement?.classList).toContain('block');
      });
    });

    it('should render the plain text view on SSR', async () => {
      jest.replaceProperty(utils, 'isClient', false);

      render(
        <TestRouterContext
          loaderData={{
            entity: { ...sampleEntity, mainDocument: [mainDocumentFile] },
            pagePlaintext: pageText,
          }}
        >
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      await waitFor(() => {
        expect(screen.getByText(pageText).parentElement?.classList).toContain('block');
      });

      jest.restoreAllMocks();
    });
  });

  describe('Entity without mainDocument', () => {
    it('does not render Document tab and defaults to Metadata', async () => {
      const entityNoDoc = { ...sampleEntity, mainDocument: undefined } as any;

      render(
        <TestRouterContext loaderData={{ entity: entityNoDoc, pagePlaintext: '' }}>
          <Entity />
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
  });

  describe('search tab', () => {
    it('should be shown by default when there is a search in the URL', async () => {
      const snippets = {
        data: [],
      };

      render(
        <TestRouterContext
          loaderData={{ entity: sampleEntity, pagePlaintext: '', searchResults: snippets }}
          initialEntries={['/?searchTerm=term']}
        >
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      const input = screen.getByRole('searchbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('term');
    });

    it('should show seach results', async () => {
      const snippets = {
        data: [
          {
            id: 's1',
            snippets: {
              metadata: [{ field: 'title', texts: ['<b>Match title</b>'] }],
              fullText: [{ page: 3, text: 'Excerpt <b>match</b>' }],
            },
          },
        ],
      } as any;

      render(
        <TestRouterContext
          loaderData={{ entity: sampleEntity, pagePlaintext: '', searchResults: snippets }}
        >
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      expect(screen.getByText('Match title')).toBeInTheDocument();
      expect(screen.getByText('Page 3')).toBeInTheDocument();
    });

    it('should scroll to the page and then to the snippet of the result', async () => {
      jest.useFakeTimers();

      const snippets = {
        data: [
          {
            id: 's1',
            snippets: {
              metadata: [],
              fullText: [{ page: 5, text: 'Some <b>text</b>' }],
            },
          },
        ],
      };

      render(
        <TestRouterContext
          loaderData={{ entity: sampleEntity, pagePlaintext: '', searchResults: snippets }}
        >
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      const pageButton = screen.getByText('Page 5');

      fireEvent.click(pageButton);

      expect(mockGoToPage).toHaveBeenCalledWith(5);

      jest.advanceTimersByTime(200);

      expect(mockActivateSnippet).toHaveBeenCalledWith(snippets.data[0].snippets.fullText[0]);

      jest.useRealTimers();
      jest.clearAllMocks();
    });
  });
});