import React, { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { SafeHTML } from '#app/utils/SafeHTML.js';

type MarkdownProps = {
  values: {
    value: string;
  }[];
};

const markdownParser = new MarkdownIt({ html: true });

const safeCssValue = [/^[a-zA-Z0-9\s,.#%()-]+$/];

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'del', 'ins']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    '*': ['id', 'class', 'style'],
    a: ['href', 'name', 'target', 'rel'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
    abbr: ['title'],
  },
  allowedStyles: {
    '*': Object.fromEntries(
      [
        'color',
        'background-color',
        'font-family',
        'font-size',
        'font-style',
        'font-weight',
        'text-align',
        'text-decoration',
        'text-transform',
        'vertical-align',
      ].map(property => [property, safeCssValue])
    ),
  },
  transformTags: {
    a: (tagName: string, attribs: sanitizeHtml.Attributes) => ({
      tagName,
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noreferrer noopener',
      },
    }),
  },
};

const Markdown = ({ values }: MarkdownProps) => {
  const blocks = useMemo(() => {
    const seen = new Map<string, number>();
    return (values ?? []).flatMap(item => {
      const html = sanitizeHtml(markdownParser.render(item.value || ''), sanitizeOptions);
      if (html === '') {
        return [];
      }
      const count = (seen.get(html) ?? 0) + 1;
      seen.set(html, count);
      return [{ html, key: count === 1 ? html : `${html}#${count}` }];
    });
  }, [values]);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      {blocks.map(block => (
        <div key={block.key} className="entity-markdown">
          <SafeHTML>{block.html}</SafeHTML>
        </div>
      ))}
    </div>
  );
};

export { Markdown };
