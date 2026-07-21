/**
 * @jest-environment jsdom
 */
import React, { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { useResolvedBackgroundColor } from '../useResolvedBackgroundColor.js';

const TestWithParent = ({ parentBg }: { parentBg: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const bg = useResolvedBackgroundColor(ref);
  return (
    <div style={{ backgroundColor: parentBg }}>
      <div ref={ref} data-testid="target">
        <span data-testid="result">{bg}</span>
      </div>
    </div>
  );
};

describe('useResolvedBackgroundColor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns the parent background when the element is transparent', () => {
    render(<TestWithParent parentBg="rgb(18, 72, 107)" />);
    expect(screen.getByTestId('result').textContent).toBe('rgb(18, 72, 107)');
  });

  it('updates when a parent style changes', async () => {
    const { getByTestId } = render(<TestWithParent parentBg="rgb(0, 0, 0)" />);
    expect(getByTestId('result').textContent).toBe('rgb(0, 0, 0)');

    const target = getByTestId('target');
    const parent = target.parentElement!;

    await act(async () => {
      parent.style.backgroundColor = 'rgb(240, 240, 240)';
    });

    expect(getByTestId('result').textContent).toBe('rgb(240, 240, 240)');
  });
});
