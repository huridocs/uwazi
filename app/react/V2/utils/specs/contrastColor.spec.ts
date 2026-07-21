/**
 * @jest-environment jsdom
 */
import { resolveBackgroundColor, getLuminance, getContrastColor } from '../contrastColor.js';

// ---------------------------------------------------------------------------
// Helpers: build a detached DOM subtree with controlled computed styles
// ---------------------------------------------------------------------------

/**
 * jsdom does not implement getComputedStyle for inline styles by default —
 * it returns the inline `style` attribute value directly when set via
 * `element.style.backgroundColor`.
 */
const makeEl = (bg: string | null): HTMLElement => {
  const el = document.createElement('div');
  if (bg) el.style.backgroundColor = bg;
  return el;
};

const buildTree = (...bgs: Array<string | null>): HTMLElement => {
  // bgs[0] = outermost ancestor … bgs[last] = the target element
  const els = bgs.map(bg => makeEl(bg));
  for (let i = 0; i < els.length - 1; i += 1) {
    els[i].appendChild(els[i + 1]);
  }
  document.body.appendChild(els[0]);
  return els[els.length - 1];
};

afterEach(() => {
  document.body.innerHTML = '';
});

// ---------------------------------------------------------------------------
// resolveBackgroundColor
// ---------------------------------------------------------------------------

describe('resolveBackgroundColor', () => {
  it('returns the color of the element itself when set', () => {
    const el = buildTree('rgb(18, 72, 107)');
    expect(resolveBackgroundColor(el)).toBe('rgb(18, 72, 107)');
  });

  it('skips a transparent element and returns the parent color', () => {
    const el = buildTree('rgb(18, 72, 107)', '');
    expect(resolveBackgroundColor(el)).toBe('rgb(18, 72, 107)');
  });

  it('skips two transparent levels and returns the grandparent color', () => {
    const el = buildTree('rgb(18, 72, 107)', '', '');
    expect(resolveBackgroundColor(el)).toBe('rgb(18, 72, 107)');
  });

  it('skips an rgba(0,0,0,0) element and returns the ancestor color', () => {
    // Explicitly set rgba(0,0,0,0) which is the other "transparent" value browsers report
    const grandparent = makeEl('rgb(30, 30, 30)');
    const parent = document.createElement('div');
    parent.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    const child = document.createElement('div');
    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);
    expect(resolveBackgroundColor(child)).toBe('rgb(30, 30, 30)');
  });

  it('falls back to white when the whole ancestor chain is transparent', () => {
    const el = buildTree('', '');
    expect(resolveBackgroundColor(el)).toBe('rgb(255, 255, 255)');
  });
});

// ---------------------------------------------------------------------------
// getLuminance
// ---------------------------------------------------------------------------

describe('getLuminance', () => {
  it('returns 0 for black', () => {
    expect(getLuminance('rgb(0, 0, 0)')).toBeCloseTo(0, 5);
  });

  it('returns 1 for white', () => {
    expect(getLuminance('rgb(255, 255, 255)')).toBeCloseTo(1, 5);
  });

  it('returns ~0.2126 for pure red', () => {
    expect(getLuminance('rgb(255, 0, 0)')).toBeCloseTo(0.2126, 3);
  });

  it('returns ~0.7152 for pure green', () => {
    expect(getLuminance('rgb(0, 255, 0)')).toBeCloseTo(0.7152, 3);
  });

  it('returns ~0.0722 for pure blue', () => {
    expect(getLuminance('rgb(0, 0, 255)')).toBeCloseTo(0.0722, 3);
  });

  it('handles rgba strings (ignores the alpha channel)', () => {
    // Same as black numerically — alpha is ignored in luminance
    expect(getLuminance('rgba(0, 0, 0, 0.5)')).toBeCloseTo(0, 5);
  });

  it('handles hex colors', () => {
    expect(getLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(getLuminance('#000000')).toBeCloseTo(0, 5);
  });

  it('handles hsl colors', () => {
    expect(getLuminance('hsl(0, 0%, 100%)')).toBeCloseTo(1, 5);
    expect(getLuminance('hsl(0, 0%, 0%)')).toBeCloseTo(0, 5);
  });
});

// ---------------------------------------------------------------------------
// getContrastColor
// ---------------------------------------------------------------------------

describe('getContrastColor', () => {
  it('returns white on a black background', () => {
    expect(getContrastColor('rgb(0, 0, 0)')).toBe('white');
  });

  it('returns black on a white background', () => {
    expect(getContrastColor('rgb(255, 255, 255)')).toBe('black');
  });

  it('returns white for the Uwazi dark navy rgb(18, 72, 107)', () => {
    expect(getContrastColor('rgb(18, 72, 107)')).toBe('white');
  });

  it('returns white for a very dark gray', () => {
    expect(getContrastColor('rgb(30, 30, 30)')).toBe('white');
  });

  it('returns black for a very light gray', () => {
    expect(getContrastColor('rgb(240, 240, 240)')).toBe('black');
  });

  it('returns black for a mid-bright yellow (high luminance)', () => {
    expect(getContrastColor('rgb(255, 220, 0)')).toBe('black');
  });

  it('returns white for a dark hex background', () => {
    expect(getContrastColor('#12486b')).toBe('white');
  });

  it('returns black for a light hsl background', () => {
    expect(getContrastColor('hsl(0, 0%, 94%)')).toBe('black');
  });
});
