/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render } from '@testing-library/react';
import { Provider as JotaiProvider, createStore } from 'jotai';
import { localeAtom } from 'V2/atoms/translationsAtoms';
import Icon from '../Icon';

const renderWithLocale = (ui, locale) => {
  const store = createStore();
  store.set(localeAtom, locale);
  return render(<JotaiProvider store={store}>{ui}</JotaiProvider>);
};

describe('Icon (Jotai)', () => {
  it('should instantiate a FontAwesomeIcon (LTR)', () => {
    const { container } = renderWithLocale(<Icon icon="angle-right" size="xs" />, 'en');
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should flip icon for RTL languages', () => {
    // Arabic is RTL
    const { container } = renderWithLocale(<Icon icon="angle-left" />, 'ar');
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('fa-flip-horizontal');
  });

  it('should not flip icon for LTR languages', () => {
    // Spanish is LTR
    const { container } = renderWithLocale(<Icon icon="angle-left" />, 'es');
    const svg = container.querySelector('svg');
    expect(svg).not.toHaveAttribute('flip');
  });

  it('should use locale prop if provided', () => {
    // Hebrew is RTL
    const { container } = renderWithLocale(<Icon icon="angle-left" locale="he" />, 'en');
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('fa-flip-horizontal');
  });
});
