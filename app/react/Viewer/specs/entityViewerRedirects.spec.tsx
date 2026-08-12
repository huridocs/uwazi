/**
 * @jest-environment jsdom
 */
import React from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { RedirectDocumentToEntity, RedirectEntityTabToEntity } from '../entityViewerRedirects.js';

const LocationProbe = () => {
  const location = useLocation();
  return (
    <div
      data-testid="location"
      data-pathname={location.pathname}
      data-search={location.search}
      data-hash={location.hash}
    />
  );
};

describe('entityViewerRedirects', () => {
  it('redirects /document/:sharedId to /entity/:sharedId and strips query', async () => {
    render(
      <MemoryRouter initialEntries={['/en/document/abc123/text-search?page=2&file=x.pdf']}>
        <Routes>
          <Route path="/en/document/:sharedId/*" element={<RedirectDocumentToEntity />} />
          <Route path="/en/entity/:sharedId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const el = screen.getByTestId('location');
      expect(el).toHaveAttribute('data-pathname', '/en/entity/abc123');
      expect(el).toHaveAttribute('data-search', '');
      expect(el).toHaveAttribute('data-hash', '');
    });
  });

  it('redirects old entity tab URLs to /entity/:sharedId and strips query', async () => {
    render(
      <MemoryRouter initialEntries={['/en/entity/abc123/info?page=3&searchTerm=foo']}>
        <Routes>
          <Route path="/en/entity/:sharedId" element={<LocationProbe />} />
          <Route path="/en/entity/:sharedId/*" element={<RedirectEntityTabToEntity />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const el = screen.getByTestId('location');
      expect(el).toHaveAttribute('data-pathname', '/en/entity/abc123');
      expect(el).toHaveAttribute('data-search', '');
      expect(el).toHaveAttribute('data-hash', '');
    });
  });

  it('redirects any unmatched nested path under /entity/:sharedId', async () => {
    render(
      <MemoryRouter initialEntries={['/en/entity/abc123/relationships/extra?ref=1']}>
        <Routes>
          <Route path="/en/entity/:sharedId" element={<LocationProbe />} />
          <Route path="/en/entity/:sharedId/*" element={<RedirectEntityTabToEntity />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const el = screen.getByTestId('location');
      expect(el).toHaveAttribute('data-pathname', '/en/entity/abc123');
      expect(el).toHaveAttribute('data-search', '');
      expect(el).toHaveAttribute('data-hash', '');
    });
  });
});
