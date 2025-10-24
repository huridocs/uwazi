/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { TestRouterContext, setupMatchMediaMock } from 'V2/testing';
import { Entity, shouldRevalidate } from '../Entity';

jest.mock('V2/Components/PDFViewer', () => ({
  PDF: ({ fileUrl }: any) => <div data-testid="mock-pdf">PDF: {fileUrl}</div>,
}));

const sampleEntity = {
  _id: 'ent1',
  sharedId: 'shared1',
  title: 'Sample Entity',
  template: { _id: 'template1', label: 'Template 1' },
  documents: [{ filename: 'file.pdf' }],
  metadata: [],
};

let mediaMock = setupMatchMediaMock();

afterEach(() => {
  jest.clearAllMocks();
  mediaMock.restore();
  mediaMock = setupMatchMediaMock();
});

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

    const titleElements = await screen.findAllByText('Sample Entity');
    expect(titleElements.length).toBeGreaterThan(0);

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

      const titleElems = await screen.findAllByText('Sample Entity');
      expect(titleElems.length).toBeGreaterThan(0);
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
});

describe('shouldRevalidate', () => {
  it('should not revalidate when same sharedId and only search changes', () => {
    const currentParams: any = { sharedId: 's1' };
    const nextParams: any = { sharedId: 's1' };
    const currentUrl: any = { pathname: '/entity/s1', search: '?main=metadata' };
    const nextUrl: any = { pathname: '/entity/s1', search: '?main=document' };
    const result = shouldRevalidate({ currentParams, nextParams, currentUrl, nextUrl } as any);
    expect(result).toBe(false);
  });
});
