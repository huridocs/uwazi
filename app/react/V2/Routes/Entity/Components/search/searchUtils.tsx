import React from 'react';
import sanitizeHtml from 'sanitize-html';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import type { SnippetsSearchResponse } from '#V2/api/types.js';

type FullTextSnippet = {
  text: string;
  page: number;
  filename?: string;
};

const getFieldName = (fieldName: string, template?: ClientTemplateSchema) => {
  if (fieldName === 'title') {
    return 'Title';
  }

  const propertyName = fieldName.split('.')[1];
  const propertyLabel =
    template?.properties?.find(property => property.name === propertyName)?.label || '';

  return propertyLabel;
};

const createNode = (node: ChildNode, key: number): React.ReactNode => {
  if (node.type === 'text') {
    return node.data;
  }

  if (node.type === 'tag') {
    const element = node;
    return React.createElement(
      'b',
      { key },
      element.children &&
        element.children.map((child: ChildNode, index: number) => createNode(child, index))
    );
  }

  return '';
};

const parseSnippetToNodes = (html?: string) => {
  const sanitized = sanitizeHtml(html || '', { allowedTags: ['b'], allowedAttributes: {} });
  if (!sanitized) {
    return '';
  }

  const document = parseDocument(sanitized);
  return document.children.map((node, i) => createNode(node as ChildNode, i));
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
        const fullText = (entry.snippets.fullText as FullTextSnippet[] | undefined)?.filter(
          snippet => !snippet.filename || snippet.filename === filename
        );
        return {
          ...entry,
          snippets: {
            ...entry.snippets,
            fullText,
            count: (entry.snippets.metadata?.length ?? 0) + (fullText?.length ?? 0),
          },
        };
      })
      .filter(
        entry =>
          (entry.snippets.metadata?.length ?? 0) > 0 || (entry.snippets.fullText?.length ?? 0) > 0
      ),
  };
};

export { getFieldName, parseSnippetToNodes, isSnippetsResponse, scopeResultsToDocument };
