/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestAtomStoreProvider } from '#V2/testing/TestAtomStoreProvider.js';
import { localeAtom, translationsAtom } from '#V2/atoms/index.js';
import { translations } from '#app/stories/fixtures/referencesFixtures.js';
import { DEFAULT_DEBOUNCE_MS } from '#V2/CustomHooks/useDebouncedDraft.js';
import { TextFacet } from '../TextFacet.js';

const renderFacet = (onChange = jest.fn(), value = '') => {
  render(
    <TestAtomStoreProvider
      initialValues={[
        [localeAtom, 'en'],
        [translationsAtom, translations],
      ]}
    >
      <TextFacet title="Method" name="method" value={value} onChange={onChange} />
    </TestAtomStoreProvider>
  );
  return onChange;
};

describe('TextFacet', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not commit on every keystroke, then commits once after debounce', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = renderFacet();

    await user.type(screen.getByRole('textbox'), 'oral');
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 1);
    });
    expect(onChange).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('oral');
  });

  it('does not commit an empty or whitespace-only value as a search', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = renderFacet();

    await user.type(screen.getByRole('textbox'), '   ');
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('commits an empty value immediately when clearing a previous term', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onChange = renderFacet(jest.fn(), 'oral');

    await user.clear(screen.getByRole('textbox'));
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    expect(onChange).toHaveBeenCalledWith('');
  });
});
