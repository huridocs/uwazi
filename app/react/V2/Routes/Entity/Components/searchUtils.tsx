/* eslint-disable react/no-array-index-key */
import React from 'react';
import sanitizeHtml from 'sanitize-html';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import type { ClientTemplateSchema } from '#V2/shared/types.js';

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

export { getFieldName, parseSnippetToNodes };
