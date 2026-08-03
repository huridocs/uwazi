/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import type { SnippetsSearchResponse } from '#V2/api/types.js';
import {
  parseSnippetToNodes,
  scopeResultsToDocument,
  sortFullTextByPage,
  sortMetadataByTemplate,
  totalMatchCount,
} from '../searchUtils.js';

const renderSnippet = (html?: string) => {
  const nodes = parseSnippetToNodes(html);
  return render(<p data-testid="snippet">{nodes}</p>);
};

describe('parseSnippetToNodes', () => {
  it('returns empty for empty or missing html', () => {
    expect(parseSnippetToNodes()).toBe('');
    expect(parseSnippetToNodes('')).toBe('');
  });

  it('renders plain text with no marks when there are no tags', () => {
    const { container } = renderSnippet('plain snippet text');
    expect(screen.getByTestId('snippet')).toHaveTextContent('plain snippet text');
    expect(container.querySelector('mark')).toBeNull();
  });

  it('maps flat <b> highlights to <mark> with highlight class tokens', () => {
    renderSnippet('before <b>hit</b> after <b>two</b>');
    const hit = screen.getByText('hit');
    const two = screen.getByText('two');
    expect(hit.tagName).toBe('MARK');
    expect(two.tagName).toBe('MARK');
    expect(hit.className).toContain('!shadow-none');
    expect(hit.className).toContain('color-theme-highlight-yellow-active');
    expect(two.className).toContain('!shadow-none');
    expect(two.className).toContain('color-theme-highlight-yellow-active');
    expect(screen.getByTestId('snippet')).toHaveTextContent('before hit after two');
  });

  it('decodes HTML entities so they are not shown literally', () => {
    renderSnippet('it&#x27;s a <b>match</b>');
    expect(screen.getByTestId('snippet')).toHaveTextContent("it's a match");
    expect(screen.getByTestId('snippet').textContent).not.toContain('&#x27;');
    expect(screen.getByText('match').tagName).toBe('MARK');
  });

  it('strips disallowed tags and still highlights flat <b>', () => {
    renderSnippet('<script>x</script>keep <b>ok</b>');
    expect(screen.getByTestId('snippet')).toHaveTextContent('keep ok');
    expect(screen.getByText('ok').tagName).toBe('MARK');
  });

  it('applies leading ellipsis for lowercase-start windowed snippets', () => {
    renderSnippet('lowercase start <b>hit</b>');
    expect(screen.getByTestId('snippet').textContent).toMatch(/^… /);
    expect(screen.getByText('hit').tagName).toBe('MARK');
  });

  it('applies trailing ellipsis for long windowed snippets without terminal punctuation', () => {
    const long = `${'word '.repeat(40)}<b>hit</b> more`;
    renderSnippet(long);
    expect(screen.getByTestId('snippet').textContent).toMatch(/ …$/);
  });

  it('does not add leading ellipsis when already present', () => {
    renderSnippet('… already windowed <b>hit</b>');
    expect(screen.getByTestId('snippet').textContent).toMatch(/^… /);
    expect(screen.getByTestId('snippet').textContent).not.toMatch(/^… …/);
  });

  it('does not add trailing ellipsis when snippet ends with terminal punctuation', () => {
    const long = `${'word '.repeat(40)}ends with <b>hit</b>.`;
    renderSnippet(long);
    expect(screen.getByTestId('snippet').textContent).toMatch(/\.$/);
    expect(screen.getByTestId('snippet').textContent).not.toMatch(/ …$/);
  });

  it('does not add ellipsis for short uppercase-start snippets', () => {
    renderSnippet('Honduras <b>match</b> here');
    const text = screen.getByTestId('snippet').textContent || '';
    expect(text).not.toMatch(/^…/);
    expect(text).not.toMatch(/…$/);
  });
});

describe('scopeResultsToDocument', () => {
  const results: SnippetsSearchResponse = {
    data: [
      {
        _id: 's1',
        snippets: {
          count: 5,
          metadata: [
            { field: 'title', texts: ['a', 'b'] },
            { field: 'metadata.description.value', texts: ['c'] },
          ],
          fullText: [
            { page: 1, text: '<b>x</b>', filename: 'doc.pdf' },
            { page: 2, text: '<b>y</b>', filename: 'other.pdf' },
            { page: 3, text: '<b>z</b>', filename: 'doc.pdf' },
          ],
        },
      },
    ],
  };

  it('recounts matches as metadata texts + scoped fullText pages', () => {
    const scoped = scopeResultsToDocument(results, 'doc.pdf');
    expect(scoped.data).toHaveLength(1);
    expect(scoped.data[0].snippets.fullText).toHaveLength(2);
    expect(scoped.data[0].snippets.count).toBe(5);
    expect(totalMatchCount(scoped)).toBe(5);
  });

  it('returns original results when filename is missing', () => {
    expect(scopeResultsToDocument(results, undefined)).toBe(results);
  });
});

describe('sortMetadataByTemplate', () => {
  const template = {
    properties: [{ name: 'date' }, { name: 'description' }, { name: 'status' }],
  };

  it('orders title first, then template.properties, unknowns last (stable)', () => {
    const metadata = [
      { field: 'metadata.status.value', texts: ['s'] },
      { field: 'metadata.unknown.value', texts: ['u1'] },
      { field: 'metadata.description.value', texts: ['d'] },
      { field: 'title', texts: ['t'] },
      { field: 'metadata.date.value', texts: ['dt'] },
      { field: 'metadata.other.label', texts: ['u2'] },
    ];

    expect(sortMetadataByTemplate(metadata, template).map(m => m.field)).toEqual([
      'title',
      'metadata.date.value',
      'metadata.description.value',
      'metadata.status.value',
      'metadata.unknown.value',
      'metadata.other.label',
    ]);
  });

  it('keeps ES order when template is missing', () => {
    const metadata = [
      { field: 'metadata.status.value', texts: ['s'] },
      { field: 'title', texts: ['t'] },
      { field: 'metadata.date.value', texts: ['dt'] },
    ];

    expect(sortMetadataByTemplate(metadata).map(m => m.field)).toEqual([
      'title',
      'metadata.status.value',
      'metadata.date.value',
    ]);
  });

  it('returns empty array for missing metadata', () => {
    expect(sortMetadataByTemplate(undefined, template)).toEqual([]);
  });
});

describe('sortFullTextByPage', () => {
  it('sorts by page ascending and keeps stable order within a page', () => {
    const fullText = [
      { page: 14, text: 'a' },
      { page: 16, text: 'b' },
      { page: 1, text: 'c' },
      { page: 14, text: 'd' },
      { page: 1, text: 'e' },
    ];

    expect(sortFullTextByPage(fullText)).toEqual([
      { page: 1, text: 'c' },
      { page: 1, text: 'e' },
      { page: 14, text: 'a' },
      { page: 14, text: 'd' },
      { page: 16, text: 'b' },
    ]);
  });

  it('returns empty array for missing fullText', () => {
    expect(sortFullTextByPage(undefined)).toEqual([]);
  });
});
