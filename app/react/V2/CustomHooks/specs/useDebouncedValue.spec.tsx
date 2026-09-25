/**
 * @jest-environment jsdom
 */
import React from 'react';
import { act, render, screen } from '@testing-library/react';
import { DEFAULT_DEBOUNCE_MS } from '../useDebouncedDraft.js';
import { useDebouncedValue } from '../useDebouncedValue.js';

const Harness = ({ value }: { value: string }) => {
  const debounced = useDebouncedValue(value);
  return <span>{debounced}</span>;
};

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the previous value until idle', () => {
    const { rerender } = render(<Harness value="a" />);
    expect(screen.getByText('a')).toBeInTheDocument();
    rerender(<Harness value="ab" />);
    expect(screen.getByText('a')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(DEFAULT_DEBOUNCE_MS);
    });
    expect(screen.getByText('ab')).toBeInTheDocument();
  });
});
