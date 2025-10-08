import React, { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { ChildNode } from 'domhandler';
import { parseDocument } from 'htmlparser2';
import { MetadataFieldProps } from './types';
import { MetadataLabel } from './MetadataLabel';

type MarkdownProps = MetadataFieldProps & {
  values: {
    value: string;
  }[];
};

const markdownParser = new MarkdownIt({ html: true });

const allowedTags = [
  'p',
  'span',
  'strong',
  'em',
  'a',
  'ul',
  'ol',
  'li',
  'pre',
  'code',
  'blockquote',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'img',
];

const allowedAttributes = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  code: ['class'],
  span: ['class'],
  p: ['class'],
};

// eslint-disable-next-line max-statements
const createReactNode = (node: ChildNode, key: number): React.ReactNode => {
  if (node.type === 'text') {
    return node.data;
  }

  if (node.type === 'tag') {
    const { name, attribs, children } = node;
    const props: any = { key };

    if (attribs.class) props.className = attribs.class;

    if (name === 'a' && attribs.href) {
      props.href = attribs.href;
      props.target = '_blank';
      props.rel = 'noopener noreferrer';
    }

    if (name === 'img' && attribs.src) props.src = attribs.src;

    return React.createElement(
      name,
      props,
      children?.map((child, i) => createReactNode(child, i))
    );
  }

  return null;
};

const Markdown = ({ label, translationContext, values, hideLabel }: MarkdownProps) => {
  const value = values?.[0]?.value || '';

  const sanitizedNodes = useMemo(() => {
    const html = markdownParser.render(value);

    const safeHtml = sanitizeHtml(html, {
      allowedTags,
      allowedAttributes,
    });

    const document = parseDocument(safeHtml);

    return document.children.map((node, i) => createReactNode(node, i));
  }, [value]);

  return (
    <div>
      <MetadataLabel label={label} translationContext={translationContext} hideLabel={hideLabel} />
      <dd className="font-medium text-gray-900 prose max-w-none">{sanitizedNodes}</dd>
    </div>
  );
};

export { Markdown };
