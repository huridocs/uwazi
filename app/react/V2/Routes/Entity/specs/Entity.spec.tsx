/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Entity as EntityType } from 'V2/domain/entities/Entity';
import { TestRouterContext, setupMatchMediaMock } from 'V2/testing';
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

let mediaMock = setupMatchMediaMock();

afterEach(() => {
  jest.clearAllMocks();
  mediaMock.restore();
  mediaMock = setupMatchMediaMock();
});

const checkEntityRendered = async () => {
  const titleElements = await screen.findAllByText('Sample Entity');
  expect(titleElements.length).toBeGreaterThan(0);
};

describe('Entity view', () => {
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
      <TestRouterContext loaderData={sampleEntity}>
        <Entity />
      </TestRouterContext>
    );

    await checkEntityRendered();

    expect(screen.getByTestId('mock-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('mock-pdf')).toHaveTextContent('/api/files/file.pdf');
  });

  describe('Tabs', () => {
    beforeEach(async () => {
      render(
        <TestRouterContext loaderData={sampleEntity}>
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
  });

  describe('Plain text view', () => {
    it('should switch to plain text view', async () => {
      const mainDocumentFile = {
        fullText: { 1: 'This is the plain text' },
        filename: 'file.pdf',
      };

      render(
        <TestRouterContext loaderData={{ ...sampleEntity, mainDocument: mainDocumentFile }}>
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
        expect(screen.getByText('This is the plain text').parentElement?.classList).toContain(
          'block'
        );
      });
    });

    it('shoul display the plain text view page based on the url', async () => {
      const mainDocumentFile = {
        fullText: { 1: 'Shown from url plain text', 5: 'Page 5 content' },
        filename: 'file.pdf',
      };

      render(
        <TestRouterContext
          path="/entity/:sharedId"
          loaderData={{ ...sampleEntity, mainDocument: mainDocumentFile }}
          initialEntries={['/entity/shared1?raw=true&page=5']}
        >
          <Entity />
        </TestRouterContext>
      );

      await checkEntityRendered();

      await waitFor(() => {
        expect(screen.queryByText('Shown from url plain text')).not.toBeInTheDocument();
        expect(screen.getByText('Page 5 content').parentElement?.classList).toContain('block');
      });
    });
  });

  describe('shouldRevalidate', () => {
    it('should not revalidate when switching search params', () => {
      const currentParams: any = { sharedId: 's1' };
      const nextParams: any = { sharedId: 's1' };
      const currentUrl: any = { pathname: '/entity/s1', search: '?main=metadata' };
      const nextUrl: any = { pathname: '/entity/s1', search: '?main=document' };
      const result = shouldRevalidate({ currentParams, nextParams, currentUrl, nextUrl } as any);
      expect(result).toBe(false);
    });

    it('should revalidate when sharedId changes', () => {
      const currentParams: any = { sharedId: 's1' };
      const nextParams: any = { sharedId: 's2' };
      const currentUrl: any = { pathname: '/entity/s1', search: '?main=metadata' };
      const nextUrl: any = { pathname: '/entity/s2', search: '?main=metadata' };
      const result = shouldRevalidate({ currentParams, nextParams, currentUrl, nextUrl } as any);
      expect(result).toBe(true);
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
