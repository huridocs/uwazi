/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { TestAtomStoreProvider } from 'V2/testing';
import { translationsAtom, inlineEditAtom, localeAtom } from 'V2/atoms';
import { Translate } from '../Translate';
import { translations } from './fixtures';

let initialValues: any[];

describe('Translate', () => {
  const renderWithAtoms = (props = {}) => {
    const { container, ...rest } = render(
      <TestAtomStoreProvider initialValues={initialValues}>
        <Translate {...props} />
      </TestAtomStoreProvider>
    );
    return { container, ...rest };
  };

  beforeEach(() => {
    initialValues = [
      [translationsAtom, translations],
      [localeAtom, 'es'],
      [inlineEditAtom, { inlineEdit: false, context: '', translationKey: '' }],
    ];
  });

  it('renders the translated text for the current locale and context', () => {
    const { getByText } = renderWithAtoms({
      context: 'System',
      translationKey: 'Search',
      children: 'Search',
    });
    expect(getByText('Buscar')).toBeInTheDocument();
  });

  it('falls back to children if translation is missing', () => {
    const { getByText } = renderWithAtoms({
      context: 'System',
      translationKey: 'NonexistentKey',
      children: 'Fallback',
    });
    expect(getByText('Fallback')).toBeInTheDocument();
  });

  it('renders bold markdown', () => {
    const { getByText } = renderWithAtoms({
      context: 'System',
      translationKey: 'boldTest',
      children: '**BoldText**',
    });
    const el = getByText('BoldText');
    expect(el.tagName).toBe('STRONG');
  });

  it('renders italic markdown', () => {
    const { getByText } = renderWithAtoms({
      context: 'System',
      translationKey: 'italicTest',
      children: '*ItalicText*',
    });
    const el = getByText('ItalicText');
    expect(el.tagName).toBe('I');
  });

  it('renders multiple lines with <br />', () => {
    const { container } = renderWithAtoms({
      context: 'System',
      translationKey: 'multiline',
      children: 'Line1\nLine2',
    });
    // Check that both lines are present in the DOM
    expect(container.textContent).toContain('Line1');
    expect(container.textContent).toContain('Line2');
    expect(container.querySelectorAll('br').length).toBe(1);
  });

  it('applies truncation when truncate prop is set', () => {
    const { container } = renderWithAtoms({
      context: 'System',
      translationKey: 'long',
      children: 'This is a very long line that should be truncated',
      truncate: 10,
    });
    expect(container.querySelector('span span.pointer-events-auto')).toBeTruthy();
    expect(container.querySelector('span span.pointer-events-auto')?.textContent).toBe('...');
  });

  it('sets active class when inlineEdit is true', async () => {
    initialValues = [
      [translationsAtom, translations],
      [localeAtom, 'es'],
      [inlineEditAtom, { inlineEdit: true, context: 'System', translationKey: 'Search' }],
    ];
    const { container } = renderWithAtoms({
      context: 'System',
      translationKey: 'Search',
      children: 'Search',
    });

    await waitFor(() => {
      expect(container.querySelector('span')?.className).toContain('active');
    });
  });
});
