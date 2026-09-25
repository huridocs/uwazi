/** @jest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Markdown } from '../Markdown.js';

describe('Markdown', () => {
  const renderValues = (...values: string[]) =>
    render(<Markdown values={values.map(value => ({ value }))} />);

  it('should keep safe inline tags with their class and style attributes', () => {
    renderValues('A <span class="highlight" style="color: red">red</span> word');

    const span = screen.getByText('red');

    expect(span.tagName).toBe('SPAN');
    expect(span).toHaveClass('highlight');
    expect(span).toHaveStyle({ color: 'red' });
  });

  it('should keep text modification and semantic inline tags', () => {
    renderValues(
      '<del>old</del> <ins>new</ins> <mark>note</mark> <abbr title="as soon">asap</abbr>'
    );

    expect(screen.getByText('old').tagName).toBe('DEL');
    expect(screen.getByText('new').tagName).toBe('INS');
    expect(screen.getByText('note').tagName).toBe('MARK');
    expect(screen.getByText('asap')).toHaveAttribute('title', 'as soon');
  });

  it('should remove dangerous tags, event handlers and style properties', () => {
    const { container } = renderValues(
      '<script>alert(1)</script><iframe src="http://evil"></iframe>' +
        '<span onclick="alert(1)" style="position: fixed; background-image: url(http://evil)">text</span>'
    );

    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();

    const span = screen.getByText('text');

    expect(span).not.toHaveAttribute('onclick');
    expect(span.style.position).toBe('');
    expect(span.style.backgroundImage).toBe('');
  });

  it('should render one block per value and ignore empty ones', () => {
    renderValues('first', '', 'second');

    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });
});
