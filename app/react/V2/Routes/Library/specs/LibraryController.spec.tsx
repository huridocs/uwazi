/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { UploadService } from '#V2/api/files/UploadService.js';
import type { FileType } from '#shared/types/fileType.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { TestAtomStoreProvider } from '#V2/testing/index.js';
import { LibraryController } from '../LibraryController.js';

class ResizeObserverMock {
  observe = jest.fn();

  unobserve = jest.fn();

  disconnect = jest.fn();
}

global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;

const alpha: LibrarySearchHit = {
  _id: 'a',
  sharedId: 'alpha',
  title: 'Alpha',
  template: 't1',
  language: 'en',
};

const created: LibrarySearchHit = {
  _id: 'pdf-id',
  sharedId: 'pdf-entity',
  title: 'Judgment',
  template: 't1',
  language: 'en',
};

const aggregations = {
  templates: [],
  published: { published: 0, restricted: 0 },
  properties: {},
};

const stubUpload = () => {
  const isUploadBody = (value: unknown): value is FileType =>
    Boolean(value) && typeof value === 'object';
  const body: unknown = { data: created };
  return jest
    .spyOn(UploadService.prototype, 'upload')
    .mockImplementation(async () => (isUploadBody(body) ? [body] : []));
};

const createdRouter = () => {
  let calls = 0;
  return createMemoryRouter(
    [
      {
        path: '/',
        loader: () => {
          calls += 1;
          const rows = calls > 1 ? [alpha, created] : [alpha];
          return { rows, totalRows: rows.length, aggregations };
        },
        Component: () => (
          <NuqsAdapter>
            <LibraryController />
          </NuqsAdapter>
        ),
      },
    ],
    { initialEntries: ['/'] }
  );
};

describe('LibraryController created rows', () => {
  it('selects the uploaded entity and lists it until the loader contains that shared id', async () => {
    const upload = stubUpload();
    const router = createdRouter();

    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, []],
          [translationsAtom, translations],
          [
            settingsAtom,
            { languages: [{ key: 'en', label: 'English', default: true }], features: {} },
          ],
          [userAtom, { _id: 'admin1', role: 'admin', username: 'admin', email: 'a@b.c' }],
        ]}
      >
        <RouterProvider router={router} />
      </TestAtomStoreProvider>
    );

    expect(await screen.findByText('Alpha')).toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'Upload PDF' }));
    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error('missing file input');
    fireEvent.change(input, {
      target: { files: [new File(['%PDF'], 'judgment.pdf', { type: 'application/pdf' })] },
    });

    await waitFor(() => {
      expect(upload).toHaveBeenCalled();
      const ids = [...document.querySelectorAll('[data-select-id]')].map(node =>
        node.getAttribute('data-select-id')
      );
      expect(ids.filter(id => id === 'pdf-entity')).toEqual(['pdf-entity']);
      expect(document.querySelector('[data-select-id="pdf-entity"]')).toHaveAttribute(
        'aria-pressed',
        'true'
      );
    });
  });
});
