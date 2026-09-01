/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SEARCH_DEBOUNCE_MS, useLibrarySearchDraft } from '../useLibrarySearchDraft.js';

const Harness = ({
  urlSearch,
  onCommit,
}: {
  urlSearch: string;
  onCommit: (value: string) => void;
}) => {
  const { draft, setDraft, commitNow } = useLibrarySearchDraft(urlSearch, onCommit);
  return (
    <div>
      <input aria-label="Search" value={draft} onChange={event => setDraft(event.target.value)} />
      <button type="button" onClick={() => commitNow(draft)}>
        Flush
      </button>
    </div>
  );
};

describe('useLibrarySearchDraft', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not commit while typing, then commits once after the debounce', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness urlSearch="" onCommit={onCommit} />);

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'batman');
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('batman');
  });

  it('restarts the timer on each keystroke', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness urlSearch="" onCommit={onCommit} />);

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'ba');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 50);
    });
    await user.type(screen.getByRole('textbox', { name: 'Search' }), 't');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('bat');
  });

  it('commits an empty value immediately so clear is not delayed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness urlSearch="batman" onCommit={onCommit} />);

    await user.clear(screen.getByRole('textbox', { name: 'Search' }));
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    expect(onCommit).toHaveBeenCalledWith('');
  });

  it('flushes the current draft without waiting', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness urlSearch="" onCommit={onCommit} />);

    await user.type(screen.getByRole('textbox', { name: 'Search' }), 'now');
    await user.click(screen.getByRole('button', { name: 'Flush' }));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('now');

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});
