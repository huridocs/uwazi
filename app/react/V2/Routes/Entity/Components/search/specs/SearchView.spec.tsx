/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchView } from '../SearchView.js';

const activateSnippet = jest.fn();
const deactivateSnippet = jest.fn();
const goToPage = jest.fn();
const mockEnsureMainTab = jest.fn();
const mockUpdateEntityUrl = jest.fn();
let mockHashParams = new URLSearchParams('searchTerm=court');
let mockPdfController: {
  activateSnippet: typeof activateSnippet;
  deactivateSnippet: typeof deactivateSnippet;
  goToPage: typeof goToPage;
} | null = null;

jest.mock('#app/I18N/index.js', () => ({
  t: (_ctx: string, key: string) => key,
  Translate: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('#V2/atoms/index.js', () => ({
  templatesAtom: {},
}));

jest.mock('jotai', () => {
  const actual = jest.requireActual('jotai');
  return {
    ...actual,
    useAtomValue: () => [],
  };
});

jest.mock('#V2/Routes/Entity/Components/context/index.js', () => ({
  useEntityScopedEntity: () => ({
    sharedId: 'shared1',
    template: 'tmpl1',
  }),
  useEntityLanguage: () => ({
    language: 'en',
    mainDocument: { _id: 'doc1', filename: 'file.pdf' },
  }),
  useDocumentPdf: () => ({ pdfController: mockPdfController }),
}));

jest.mock('#V2/Routes/Entity/entityUrlState.js', () => ({
  useEntityHashUiParams: () => mockHashParams,
  useEntityRawView: () => mockHashParams.get('raw') === 'true',
  useUpdateEntityUrl: () => mockUpdateEntityUrl,
}));

jest.mock('#V2/Routes/Entity/Components/search/useEntitySearchSnippets.js', () => ({
  useEntitySearchSnippets: () => ({
    searchResults: {
      data: [
        {
          _id: 'hit1',
          snippets: {
            count: 1,
            metadata: [],
            fullText: [{ text: 'hello <b>court</b> world', page: 1 }],
          },
        },
      ],
    },
    searchError: null,
  }),
}));

jest.mock('#V2/Routes/Entity/Components/search/useJumpToSearchHit.js', () => ({
  useJumpToSearchHit: () => ({ ensureMainTab: mockEnsureMainTab }),
}));

jest.mock('#V2/Components/UI/QuerySearchBar.js', () => ({
  QuerySearchBar: ({ value, onChange }: { value: string; onChange: (next: string) => void }) => (
    <input
      aria-label="Search this document"
      value={value}
      onChange={event => onChange(event.target.value)}
    />
  ),
}));

describe('SearchView activateSnippet pending flush', () => {
  beforeEach(() => {
    activateSnippet.mockClear();
    deactivateSnippet.mockClear();
    goToPage.mockClear();
    mockEnsureMainTab.mockClear();
    mockUpdateEntityUrl.mockClear();
    mockHashParams = new URLSearchParams('searchTerm=court');
    mockPdfController = null;
  });

  it('queues pending and flushes when controller becomes ready after Document remount', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SearchView />);

    await user.click(screen.getByRole('button', { name: /Page 1/i }));

    expect(mockEnsureMainTab).toHaveBeenCalledTimes(1);
    expect(mockEnsureMainTab).toHaveBeenCalledWith('document', {
      hash: expect.any(Function),
    });
    const hashPatch = mockEnsureMainTab.mock.calls[0][1]?.hash;
    const hashParams = new URLSearchParams();
    hashPatch?.(hashParams);
    expect(hashParams.get('page')).toBe('1');
    expect(activateSnippet).not.toHaveBeenCalled();

    mockPdfController = { activateSnippet, deactivateSnippet, goToPage };
    rerender(<SearchView />);

    expect(activateSnippet).toHaveBeenCalledWith({
      text: 'hello <b>court</b> world',
      page: 1,
    });
  });

  it('drives live PDF controller to snippet page on activate', async () => {
    const user = userEvent.setup();
    mockPdfController = { activateSnippet, deactivateSnippet, goToPage };
    render(<SearchView />);

    await user.click(screen.getByRole('button', { name: /Page 1/i }));

    expect(goToPage).toHaveBeenCalledWith(1);
    expect(mockEnsureMainTab).toHaveBeenCalledWith('document', {
      hash: expect.any(Function),
    });
  });

  it('skips PDF snippet APIs in raw mode and still sets the page hash', async () => {
    const user = userEvent.setup();
    mockHashParams = new URLSearchParams('searchTerm=court&raw=true');
    mockPdfController = { activateSnippet, deactivateSnippet, goToPage };
    render(<SearchView />);

    await user.click(screen.getByRole('button', { name: /Page 1/i }));

    expect(goToPage).not.toHaveBeenCalled();
    expect(activateSnippet).not.toHaveBeenCalled();
    expect(mockEnsureMainTab).toHaveBeenCalledWith('document', {
      hash: expect.any(Function),
    });
    const hashPatch = mockEnsureMainTab.mock.calls[0][1]?.hash;
    const hashParams = new URLSearchParams();
    hashPatch?.(hashParams);
    expect(hashParams.get('page')).toBe('1');
  });

  it('does not flush a pending PDF snippet after switching to raw mode', async () => {
    const user = userEvent.setup();
    mockPdfController = { activateSnippet, deactivateSnippet, goToPage };
    const { rerender } = render(<SearchView />);

    await user.click(screen.getByRole('button', { name: /Page 1/i }));
    expect(activateSnippet).toHaveBeenCalledTimes(1);

    mockHashParams = new URLSearchParams('searchTerm=court&raw=true');
    activateSnippet.mockClear();
    rerender(<SearchView />);

    expect(activateSnippet).not.toHaveBeenCalled();
  });

  it('re-activates pending when controller is replaced (stale remount)', async () => {
    const user = userEvent.setup();
    const staleActivate = jest.fn();
    mockPdfController = {
      activateSnippet: staleActivate,
      deactivateSnippet,
      goToPage,
    };
    const { rerender } = render(<SearchView />);

    await user.click(screen.getByRole('button', { name: /Page 1/i }));
    expect(staleActivate).toHaveBeenCalledTimes(1);

    const freshActivate = jest.fn();
    mockPdfController = {
      activateSnippet: freshActivate,
      deactivateSnippet,
      goToPage,
    };
    act(() => {
      rerender(<SearchView />);
    });

    expect(freshActivate).toHaveBeenCalledWith({
      text: 'hello <b>court</b> world',
      page: 1,
    });
  });

  it('debounces draft changes into writeSearchTerm / hash sync', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<SearchView />);

    const input = screen.getByRole('textbox', { name: 'Search this document' });
    await user.clear(input);
    mockUpdateEntityUrl.mockClear();
    await user.type(input, 'new term');

    expect(mockUpdateEntityUrl).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(250);
    });

    expect(mockUpdateEntityUrl).toHaveBeenCalledTimes(1);
    const patch = mockUpdateEntityUrl.mock.calls[0][0];
    const next = new URLSearchParams();
    patch.hash(next);
    expect(next.get('searchTerm')).toBe('new term');

    jest.useRealTimers();
  });

  it('clears PDF snippet selection when search term is cleared', async () => {
    const user = userEvent.setup();
    mockPdfController = { activateSnippet, deactivateSnippet, goToPage };
    render(<SearchView />);

    await user.click(screen.getByRole('button', { name: /Page 1/i }));
    expect(activateSnippet).toHaveBeenCalled();
    deactivateSnippet.mockClear();

    await user.clear(screen.getByRole('textbox', { name: 'Search this document' }));

    expect(deactivateSnippet).toHaveBeenCalled();
  });
});
