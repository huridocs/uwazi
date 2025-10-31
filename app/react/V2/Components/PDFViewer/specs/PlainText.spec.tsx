/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { PlainText } from '../PlainText';

afterEach(() => cleanup());

describe('PlainText', () => {
  it('renders the first page when page prop is not provided', () => {
    const file = { fullText: { 2: 'Second page', 10: 'Tenth page' } };
    const { container } = render(<PlainText file={file} className="my-class" />);

    const el = container.querySelector('.whitespace-pre-line');
    expect(el?.textContent).toBe('Second page');
  });

  it('renders the requested page when page prop is a number', () => {
    const file = { fullText: { 1: 'One', 3: 'Three' } };
    const { container } = render(<PlainText file={file} page={3} />);

    const el = container.querySelector('.whitespace-pre-line');
    expect(el?.textContent).toBe('Three');
  });

  it('renders the requested page when page prop is a string', () => {
    const file = { fullText: { 1: 'One', 3: 'Three' } };
    const { container } = render(<PlainText file={file} page="1" />);

    const el = container.querySelector('.whitespace-pre-line');
    expect(el?.textContent).toBe('One');
  });

  it('renders an empty string when the requested page does not exist', () => {
    const file = { fullText: { 5: 'Five' } };
    const { container } = render(<PlainText file={file} page={2} />);

    const el = container.querySelector('.whitespace-pre-line');
    expect(el?.textContent).toBe('');
  });
});
