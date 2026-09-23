/**
 * @jest-environment jsdom
 */
import React, { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import {
  localeAtom,
  settingsAtom,
  templatesAtom,
  translationsAtom,
  userAtom,
} from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { DEFAULT_DEBOUNCE_MS } from '#V2/CustomHooks/useDebouncedDraft.js';
import type { LibraryAggregations } from '#shared/types/librarySearch.js';
import type { Template } from '#app/apiResponseTypes.js';
import { LibraryFilters } from '../LibraryFilters.js';

const filterTemplates = [
  {
    _id: 'template1',
    name: 'Documents',
    properties: [
      {
        _id: 'p-method',
        name: 'method',
        label: 'Method',
        type: 'text',
        filter: true,
        defaultfilter: true,
      },
    ],
  },
] as Template[];

const aggregations: LibraryAggregations = {
  templates: [{ id: 'template1', count: 1 }],
  published: { published: 1, restricted: 0 },
  properties: {},
};

const LibraryFiltersHarness = ({ onChange }: { onChange: jest.Mock }) => {
  const [filters, setFilters] = useState<Record<string, string[]>>({ type: ['template1'] });
  return (
    <LibraryFilters
      aggregations={aggregations}
      filters={filters}
      onChange={next => {
        onChange(next);
        setFilters(next);
      }}
    />
  );
};

describe('LibraryFilters text search', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderTextFilters = (onChange = jest.fn()) => {
    render(
      <TestAtomStoreProvider
        initialValues={[
          [localeAtom, 'en'],
          [templatesAtom, filterTemplates],
          [translationsAtom, translations],
          [settingsAtom, {}],
          [userAtom, { _id: 'admin1', role: 'admin', username: 'admin' }],
        ]}
      >
        <LibraryFiltersHarness onChange={onChange} />
      </TestAtomStoreProvider>
    );
    return onChange;
  };

  it('does not write empty text-filter values into the search request', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = renderTextFilters();

    await user.type(screen.getByRole('textbox', { name: 'Method' }), '   ');
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('debounces a text filter and omits it when the value is cleared', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = renderTextFilters();

    await user.type(screen.getByRole('textbox', { name: 'Method' }), 'oral');
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ method: ['oral'] }));

    onChange.mockClear();
    await user.clear(screen.getByRole('textbox', { name: 'Method' }));
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.not.objectContaining({ method: expect.anything() })
    );
  });
});
