/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_DEBOUNCE_MS, useDebouncedDraft } from '../useDebouncedDraft.js';

const Harness = ({
  committed,
  onCommit,
  delay,
  shouldCommitImmediately,
}: {
  committed: string;
  onCommit: (value: string) => void;
  delay?: number;
  shouldCommitImmediately?: (value: string) => boolean;
}) => {
  const { draft, setDraft, commitNow } = useDebouncedDraft(committed, onCommit, {
    delay,
    shouldCommitImmediately,
  });
  return (
    <div>
      <input aria-label="Draft" value={draft} onChange={event => setDraft(event.target.value)} />
      <button type="button" onClick={() => commitNow(draft)}>
        Flush
      </button>
    </div>
  );
};

describe('useDebouncedDraft', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not commit while typing, then commits once after the debounce', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness committed="" onCommit={onCommit} />);

    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'batman');
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 1);
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
    render(<Harness committed="" onCommit={onCommit} />);

    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'ba');
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 50);
    });
    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 't');
    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS - 1);
    });
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('bat');
  });

  it('commits immediately when shouldCommitImmediately matches', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(
      <Harness
        committed="batman"
        onCommit={onCommit}
        shouldCommitImmediately={value => value === ''}
      />
    );

    await user.clear(screen.getByRole('textbox', { name: 'Draft' }));
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    expect(onCommit).toHaveBeenCalledWith('');
  });

  it('debounces empty values when shouldCommitImmediately is not set', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness committed="batman" onCommit={onCommit} />);

    await user.clear(screen.getByRole('textbox', { name: 'Draft' }));
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(onCommit).toHaveBeenCalledWith('');
  });

  it('uses a custom delay', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness committed="" onCommit={onCommit} delay={80} />);

    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'x');
    await act(async () => {
      jest.advanceTimersByTime(79);
    });
    expect(onCommit).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(onCommit).toHaveBeenCalledWith('x');
  });

  it('flushes the current draft without waiting', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const onCommit = jest.fn();
    render(<Harness committed="" onCommit={onCommit} />);

    await user.type(screen.getByRole('textbox', { name: 'Draft' }), 'now');
    await user.click(screen.getByRole('button', { name: 'Flush' }));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith('now');

    await act(async () => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it('syncs the draft when the committed value changes', () => {
    const onCommit = jest.fn();
    const { rerender } = render(<Harness committed="old" onCommit={onCommit} />);

    rerender(<Harness committed="new" onCommit={onCommit} />);

    expect(screen.getByRole('textbox', { name: 'Draft' })).toHaveValue('new');
    expect(onCommit).not.toHaveBeenCalled();
  });
});
