import React, { useMemo } from 'react';
import instanceMarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';
import { normalizeMarkdown } from './markdownUtils.js';

const markdownParser = new instanceMarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
});

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'h1',
    'h2',
    'h3',
    'h4',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ['href', 'name', 'target', 'rel'],
    th: ['align'],
    td: ['align'],
  },
};

const renderMarkdown = (text: string) => {
  const normalized = normalizeMarkdown(text);
  if (!normalized) {
    return '';
  }

  return sanitizeHtml(markdownParser.render(normalized), sanitizeOptions);
};

type MarkdownMessageContentProps = {
  text: string;
};

const MarkdownMessageContent = ({ text }: MarkdownMessageContentProps) => {
  const safeHtml = useMemo(() => renderMarkdown(text), [text]);

  if (!safeHtml) {
    return null;
  }

  return (
    // eslint-disable-next-line react/no-danger
    <div className="bert-markdown no-tailwind" dangerouslySetInnerHTML={{ __html: safeHtml }} />
  );
};

export { MarkdownMessageContent, renderMarkdown };
