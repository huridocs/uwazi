/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { markdownToReact } from '../markdownToReact.jsx';

const noopCallback = () => false;

describe('markdownToReact', () => {
  it('parses Markdown when parseMarkdown is true (default)', () => {
    const nodes = markdownToReact('**bold**', noopCallback, true, true);
    const markup = renderToStaticMarkup(<>{nodes}</>);
    expect(markup).toContain('<strong>');
  });

  it('does not apply Markdown rules when parseMarkdown is false', () => {
    const nodes = markdownToReact('**literal**', noopCallback, true, false);
    const markup = renderToStaticMarkup(<>{nodes}</>);
    expect(markup).not.toContain('<strong>');
    expect(markup).toContain('literal');
  });

  it('parses HTML tags when parseMarkdown is false', () => {
    const nodes = markdownToReact('<p>Hello</p>', noopCallback, true, false);
    const markup = renderToStaticMarkup(<>{nodes}</>);
    expect(markup).toContain('Hello');
  });
});
