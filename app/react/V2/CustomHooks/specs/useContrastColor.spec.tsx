/**
 * @jest-environment jsdom
 */
import React, { useRef } from 'react';
import { act, render, screen } from '@testing-library/react';
import { useContrastColor } from '../useContrastColor.js';

// ---------------------------------------------------------------------------
// Test component: renders a div that shows the contrast color string
// ---------------------------------------------------------------------------

const TestComponent = ({ containerStyle }: { containerStyle?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const color = useContrastColor(ref);
  return (
    <div ref={ref} style={containerStyle} data-testid="target">
      <span data-testid="result">{color}</span>
    </div>
  );
};

/**
 * Wraps a TestComponent inside a parent div with the given background,
 * leaving the TestComponent itself transparent.
 */
const TestWithParent = ({ parentBg }: { parentBg: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const color = useContrastColor(ref);
  return (
    <div style={{ backgroundColor: parentBg }}>
      <div ref={ref} data-testid="target">
        <span data-testid="result">{color}</span>
      </div>
    </div>
  );
};

/**
 * Three-level tree: grandparent has a background, parent and child are transparent.
 */
const TestWithGrandparent = ({ grandparentBg }: { grandparentBg: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const color = useContrastColor(ref);
  return (
    <div style={{ backgroundColor: grandparentBg }}>
      <div>
        <div ref={ref} data-testid="target">
          <span data-testid="result">{color}</span>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useContrastColor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('returns white when the element itself has a dark background', () => {
    render(<TestComponent containerStyle={{ backgroundColor: 'rgb(18, 72, 107)' }} />);
    expect(screen.getByTestId('result').textContent).toBe('white');
  });

  it('returns black when the element itself has a light background', () => {
    render(<TestComponent containerStyle={{ backgroundColor: 'rgb(255, 255, 255)' }} />);
    expect(screen.getByTestId('result').textContent).toBe('black');
  });

  it('returns white when the parent has a dark background and the element is transparent', () => {
    render(<TestWithParent parentBg="rgb(0, 0, 0)" />);
    expect(screen.getByTestId('result').textContent).toBe('white');
  });

  it('returns black when the parent has a light background and the element is transparent', () => {
    render(<TestWithParent parentBg="rgb(240, 240, 240)" />);
    expect(screen.getByTestId('result').textContent).toBe('black');
  });

  it('returns white when only the grandparent has a dark background', () => {
    render(<TestWithGrandparent grandparentBg="rgb(30, 30, 30)" />);
    expect(screen.getByTestId('result').textContent).toBe('white');
  });

  it('returns black when only the grandparent has a light background', () => {
    render(<TestWithGrandparent grandparentBg="rgb(250, 250, 250)" />);
    expect(screen.getByTestId('result').textContent).toBe('black');
  });

  it('defaults to black (white background fallback) when no ancestor has a background', () => {
    // No background anywhere — fallback is rgb(255,255,255) → black
    render(<TestComponent />);
    expect(screen.getByTestId('result').textContent).toBe('black');
  });

  it('updates when a parent style changes from dark to light', async () => {
    const { getByTestId } = render(<TestWithParent parentBg="rgb(0, 0, 0)" />);
    expect(getByTestId('result').textContent).toBe('white');

    // Simulate a runtime theme change on the parent
    const target = getByTestId('target');
    const parent = target.parentElement!;

    await act(async () => {
      parent.style.backgroundColor = 'rgb(255, 255, 255)';
    });

    expect(getByTestId('result').textContent).toBe('black');
  });

  it('updates when a parent style changes from light to dark', async () => {
    const { getByTestId } = render(<TestWithParent parentBg="rgb(255, 255, 255)" />);
    expect(getByTestId('result').textContent).toBe('black');

    const target = getByTestId('target');
    const parent = target.parentElement!;

    await act(async () => {
      parent.style.backgroundColor = 'rgb(0, 0, 0)';
    });

    expect(getByTestId('result').textContent).toBe('white');
  });
});
