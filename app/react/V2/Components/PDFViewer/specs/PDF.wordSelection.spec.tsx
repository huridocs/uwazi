/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { mockEventBus } from './fixtures.js';
import { PDF as PdfViewer } from '../PDF.jsx';

const mockGetDocument = jest.fn();

jest.mock('../PDFPage', () => ({
  PDFPage: ({ page, eventBus }: { page: number; eventBus?: any }) => {
    eventBus?.dispatch('pageready', { pageNumber: page });
    eventBus?.dispatch('pagerendered', { pageNumber: page });
    return <div data-testid={`pdf-page-${page}`} data-pagenumber={String(page)} />;
  },
}));

jest.mock('../pdfjs.ts', () => ({
  PDFJS: {
    getDocument: (...args: any[]) => mockGetDocument(...args),
  },
  CMAP_URL: '/legacy_character_maps/',
  WASM_URL: '/pdfjs_wasm/',
  EventBus: mockEventBus,
  PixelsPerInch: { PDF_TO_CSS_UNITS: 1 },
}));

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: () => [],
}));

global.ResizeObserver = ResizeObserverMock;

const resolvedPdf = {
  promise: Promise.resolve({
    numPages: 1,
    getPage: jest
      .fn()
      .mockResolvedValue({ getViewport: () => ({ width: 100, height: 200, scale: 1 }) }),
  }),
  onProgress: jest.fn(),
  destroy: jest.fn(),
};

const renderPdf = (textWordSelection = false) =>
  render(
    <TestAtomStoreProvider initialValues={[[settingsAtom, { features: { textWordSelection } }]]}>
      <PdfViewer fileUrl="/file.pdf" />
    </TestAtomStoreProvider>
  );

describe('PDF word selection flag', () => {
  beforeEach(() => {
    mockGetDocument.mockReset();
    mockGetDocument.mockReturnValue(resolvedPdf);
  });

  it('hides the word-selection toggle when the textWordSelection flag is off', async () => {
    await act(async () => {
      renderPdf(false);
    });
    await waitFor(() => expect(document.querySelector('#pdf-container')).toBeInTheDocument());

    expect(screen.queryByRole('checkbox', { name: 'Word selection' })).not.toBeInTheDocument();
  });

  it('shows the word-selection toggle when the textWordSelection flag is on', async () => {
    await act(async () => {
      renderPdf(true);
    });
    await waitFor(() => expect(document.querySelector('#pdf-container')).toBeInTheDocument());

    expect(screen.getByRole('checkbox', { name: 'Word selection' })).toBeInTheDocument();
    expect(document.querySelector('#pdf-container')).not.toHaveAttribute(
      'data-word-selection',
      'true'
    );
  });

  it('enables word-selection mode from the temporary toggle', async () => {
    await act(async () => {
      renderPdf(true);
    });
    await waitFor(() => expect(document.querySelector('#pdf-container')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Word selection' }));
    });

    expect(document.querySelector('#pdf-container')).toHaveAttribute('data-word-selection', 'true');
  });

  it('keeps the PDF container mounted when word selection is toggled on', async () => {
    await act(async () => {
      renderPdf(true);
    });
    await waitFor(() => expect(document.querySelector('#pdf-container')).toBeInTheDocument());

    const container = document.querySelector('#pdf-container');

    await act(async () => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Word selection' }));
    });

    expect(document.querySelector('#pdf-container')).toBe(container);
  });
});
