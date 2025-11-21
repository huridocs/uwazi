/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Entity as EntityType } from 'V2/domain/entities/Entity';
import { TestAtomStoreProvider, TestRouterContext, setupMatchMediaMock } from 'V2/testing';
import { settingsAtom, userAtom } from 'V2/atoms';
import * as files from 'V2/api/files';
import { Entity, shouldRevalidate } from '../Entity';

jest.mock('V2/Components/PDFViewer', () => ({
  ...jest.requireActual('V2/Components/PDFViewer'),
  PDF: ({ fileUrl }: any) => <div data-testid="mock-pdf">PDF: {fileUrl}</div>,
}));

const sampleEntity: Partial<EntityType> = {
  _id: 'ent1',
  sharedId: 'shared1',
  title: 'Sample Entity',
  template: { _id: 'template1', label: 'Template 1', name: 'template1' },
  mainDocument: { filename: 'file.pdf' },
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
            entity: { ...sampleEntity, mainDocument: mainDocumentFile },
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
            entity: { ...sampleEntity, mainDocument: mainDocumentFile },
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
            entity: { ...sampleEntity, mainDocument: mainDocumentFile },
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

  describe('shouldRevalidate', () => {
    it('should revalidate when sharedId changes', () => {
      const currentParams: any = { sharedId: 's1' };
      const nextParams: any = { sharedId: 's2' };
      const currentUrl: any = { pathname: '/entity/s1', search: '?m=metadata' };
      const nextUrl: any = { pathname: '/entity/s2', search: '?m=metadata' };
      const result = shouldRevalidate({ currentParams, nextParams, currentUrl, nextUrl } as any);
      expect(result).toBe(true);
    });

    it('should not revalidate when switching search params', () => {
      const currentParams: any = { sharedId: 's1' };
      const nextParams: any = { sharedId: 's1' };
      const currentUrl: any = { pathname: '/entity/s1', search: '?m=metadata' };
      const nextUrl: any = { pathname: '/entity/s1', search: '?m=document' };
      const result = shouldRevalidate({
        currentParams,
        nextParams,
        currentUrl,
        nextUrl,
        defaultShouldRevalidate: true,
      } as any);
      expect(result).toBe(false);
    });

    it('should revalidate when params and sharedId are the same and defaultShouldRevalidate is true', () => {
      const currentParams: any = { sharedId: 's1' };
      const nextParams: any = { sharedId: 's1' };
      const currentUrl: any = { pathname: '/entity/s1', search: '?m=1' };
      const nextUrl: any = { pathname: '/entity/s1', search: '?m=1' };
      const result = shouldRevalidate({
        currentParams,
        nextParams,
        currentUrl,
        nextUrl,
        defaultShouldRevalidate: true,
      } as any);
      expect(result).toBe(true);
    });
  });
});
