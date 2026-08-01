import React from 'react';
import sanitizeHtml from 'sanitize-html';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import type { SnippetsSearchResponse } from '#V2/api/types.js';
import { esFieldToFocusKey } from '#V2/Components/Metadata/focusMetadataFieldAtom.js';

type MetadataSnippet = { field: string; texts: string[] };

/** Design HighlightedText MARK_CLASS — yellow fill only; `!` beats legacy `mark` blue + any halo. */
const MARK_CLASS =
  'rounded-[2px] !text-ink !shadow-none ' +
  '!bg-[color-mix(in_oklab,var(--color-theme-highlight-yellow-active)_70%,transparent)]';

const LEADING_ELLIPSIS = /^(?:\u2026|\.{3})\s*/u;
const TRAILING_ELLIPSIS = /\s*(?:\u2026|\.{3})$/u;
const WINDOWED_MIN_LENGTH = 160;
const FLAT_B_SEGMENT = /(<b>[\s\S]*?<\/b>)/gi;
const FLAT_B_INNER = /^<b>([\s\S]*?)<\/b>$/i;

const getFieldName = (fieldName: string, template?: ClientTemplateSchema) => {
  if (fieldName === 'title') {
    return 'Title';
  }

  const propertyName = fieldName.split('.')[1];
  const propertyLabel =
    template?.properties?.find(property => property.name === propertyName)?.label || '';

  return propertyLabel;
};

const decodeSnippetText = (segment: string) =>
  sanitizeHtml(segment, { allowedTags: [], allowedAttributes: {} });

const plainSnippetText = (html: string) =>
  decodeSnippetText(html).replace(/\s+/g, ' ').trim();

const startsWithLowercaseLetter = (text: string) => {
  const letter = text.match(/\p{L}/u)?.[0];
  return Boolean(letter && letter === letter.toLowerCase() && letter !== letter.toUpperCase());
};

const endsWithTerminalPunctuation = (text: string) => /[.!?…]$/u.test(text);

const ensureSnippetEllipsis = (html: string) => {
  const plain = plainSnippetText(html);
  if (!plain) return html;

  const hasLeading = LEADING_ELLIPSIS.test(plain);
  const hasTrailing = TRAILING_ELLIPSIS.test(plain);
  const core = plain.replace(LEADING_ELLIPSIS, '').replace(TRAILING_ELLIPSIS, '').trim();
  const startsLower = startsWithLowercaseLetter(core);
  const windowed = startsLower || core.length >= WINDOWED_MIN_LENGTH;

  const needsLeading = !hasLeading && startsLower;
  const needsTrailing =
    !hasTrailing && !endsWithTerminalPunctuation(core) && windowed;

  if (!needsLeading && !needsTrailing) return html;

  return `${needsLeading ? '… ' : ''}${html}${needsTrailing ? ' …' : ''}`;
};

const parseSnippetToNodes = (html?: string) => {
  const sanitized = sanitizeHtml(html || '', { allowedTags: ['b'], allowedAttributes: {} });
  if (!sanitized) {
    return '';
  }

  return ensureSnippetEllipsis(sanitized)
    .split(FLAT_B_SEGMENT)
    .map((part, i) => {
      const markMatch = part.match(FLAT_B_INNER);
      if (markMatch) {
        return (
          <mark key={i} className={MARK_CLASS}>
            {decodeSnippetText(markMatch[1])}
          </mark>
        );
      }
      return decodeSnippetText(part);
    });
};

const isSnippetsResponse = (value: unknown): value is SnippetsSearchResponse =>
  Boolean(value && typeof value === 'object' && 'data' in value);

const scopeResultsToDocument = (
  results: SnippetsSearchResponse,
  filename: string | undefined
): SnippetsSearchResponse => {
  if (!filename) return results;

  return {
    ...results,
    data: results.data
      .map(entry => {
        const fullText = entry.snippets.fullText?.filter(
          snippet => !snippet.filename || snippet.filename === filename
        );
        const metadataMatchCount = (entry.snippets.metadata ?? []).reduce(
          (sum, row) => sum + (row.texts?.length ?? 0),
          0
        );
        return {
          ...entry,
          snippets: {
            ...entry.snippets,
            fullText,
            count: metadataMatchCount + (fullText?.length ?? 0),
          },
        };
      })
      .filter(
        entry =>
          (entry.snippets.metadata?.length ?? 0) > 0 || (entry.snippets.fullText?.length ?? 0) > 0
      ),
  };
};

const totalMatchCount = (results: SnippetsSearchResponse): number =>
  results.data.reduce((sum, entry) => sum + (entry.snippets.count || 0), 0);

const sortMetadataByTemplate = (
  metadata: MetadataSnippet[] | undefined,
  template?: { properties?: ReadonlyArray<{ name: string }> }
): MetadataSnippet[] => {
  if (!metadata?.length) return [];

  const propOrder = new Map((template?.properties ?? []).map((property, i) => [property.name, i]));

  return metadata
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aKey = esFieldToFocusKey(a.item.field);
      const bKey = esFieldToFocusKey(b.item.field);
      const aIsTitle = aKey === 'title';
      const bIsTitle = bKey === 'title';
      if (aIsTitle !== bIsTitle) return aIsTitle ? -1 : 1;

      const aOrder = propOrder.get(aKey) ?? Number.POSITIVE_INFINITY;
      const bOrder = propOrder.get(bKey) ?? Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.index - b.index;
    })
    .map(({ item }) => item);
};

const sortFullTextByPage = <T extends { page: number }>(fullText: T[] | undefined): T[] => {
  if (!fullText?.length) return [];

  return fullText
    .map((item, index) => ({ item, index }))
    .sort((a, b) => a.item.page - b.item.page || a.index - b.index)
    .map(({ item }) => item);
};

export {
  getFieldName,
  parseSnippetToNodes,
  isSnippetsResponse,
  scopeResultsToDocument,
  totalMatchCount,
  sortMetadataByTemplate,
  sortFullTextByPage,
};
