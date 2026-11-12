/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider, TestRouterContext } from '#V2/testing/index.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { UploadService } from '#V2/api/files/UploadService.js';
import { LibraryView } from '../LibraryView.js';

jest.mock('#V2/api/files/UploadService.js', () => ({
  UploadService: jest.fn(),
}));

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const mockCreateFromPdf = (
  created: { data: { sharedId: string; title?: string } }[] = [{ data: { sharedId: 'pdf-entity' } }]
) => {
  const upload = jest.fn().mockResolvedValue(created);
  const onProgress = jest.fn();
  const onUploadComplete = jest.fn();
  (UploadService as unknown as jest.Mock).mockImplementation((endpoint: string) => {
    expect(endpoint).toBe('createFromPDF');
    return { onProgress, onUploadComplete, upload };
  });
  return upload;
};

const renderUploadLibrary = (onEntityCreated: (sharedId?: string) => void) =>
  render(
    <TestRouterContext>
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, []],
          [translationsAtom, translations],
          [settingsAtom, { languages: [{ key: 'en', label: 'English', default: true }] }],
          [userAtom, { _id: 'admin1', role: 'admin', username: 'admin', email: 'a@b.c' }],
        ]}
      >
        <LibraryView
          rows={[]}
          totalRows={0}
          aggregations={{
            templates: [],
            published: { published: 0, restricted: 0 },
            properties: {},
          }}
          search=""
          onSearchChange={() => undefined}
          view="cards"
          onViewChange={() => undefined}
          sort=""
          order="desc"
          onSortChange={() => undefined}
          filters={{}}
          onFiltersChange={() => undefined}
          andFilters={[]}
          onAndFiltersChange={() => undefined}
          chips={[]}
          selectedIds={[]}
          onSelectedIdsChange={jest.fn()}
          onClosePreview={() => undefined}
          entityBasePath="/entityv2"
          onEntityCreated={onEntityCreated}
        />
      </TestAtomStoreProvider>
    </TestRouterContext>
  );

const chooseFiles = () => {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  const pdf = new File(['%PDF'], 'judgment.pdf', { type: 'application/pdf' });
  const other = new File(['hello'], 'notes.txt', { type: 'text/plain' });
  fireEvent.change(input, { target: { files: [pdf, other] } });
  return pdf;
};

describe('Library upload PDF', () => {
  it('uploads a file chosen in the native picker through create-from-pdf', async () => {
    const upload = mockCreateFromPdf();
    const onEntityCreated = jest.fn();
    renderUploadLibrary(onEntityCreated);
    fireEvent.click(await screen.findByRole('button', { name: 'Upload PDF' }));
    expect(screen.queryByRole('dialog', { name: 'Upload PDF' })).not.toBeInTheDocument();
    const pdf = chooseFiles();
    await waitFor(() => {
      expect(upload).toHaveBeenCalledWith([pdf]);
      expect(onEntityCreated).toHaveBeenCalledWith(
        'pdf-entity',
        expect.objectContaining({ sharedId: 'pdf-entity' })
      );
    });
  });

  it('creates a library row for every pdf chosen together', async () => {
    const upload = mockCreateFromPdf([
      { data: { sharedId: 'pdf-a', title: 'A' } },
      { data: { sharedId: 'pdf-b', title: 'B' } },
    ]);
    const onEntityCreated = jest.fn();
    renderUploadLibrary(onEntityCreated);
    fireEvent.click(await screen.findByRole('button', { name: 'Upload PDF' }));
    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('missing file input');
    fireEvent.change(input, {
      target: {
        files: ['a.pdf', 'b.pdf'].map(
          name => new File(['%PDF'], name, { type: 'application/pdf' })
        ),
      },
    });
    await waitFor(() => {
      expect(upload).toHaveBeenCalled();
      expect(onEntityCreated).toHaveBeenNthCalledWith(
        1,
        'pdf-a',
        expect.objectContaining({ sharedId: 'pdf-a' })
      );
      expect(onEntityCreated).toHaveBeenNthCalledWith(
        2,
        'pdf-b',
        expect.objectContaining({ sharedId: 'pdf-b' })
      );
    });
  });
});
