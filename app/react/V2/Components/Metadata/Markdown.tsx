import React, { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { MetadataFieldProps } from './types';
import { PropertyLabel } from './PropertyLabel';
import { MetadataCard } from './MetadataCard';

type MarkdownProps = MetadataFieldProps & {
  values: {
    value: string;
  }[];
};

const markdownParser = new MarkdownIt({ html: true });

const Markdown = ({ label, translationContext, values, hideLabel }: MarkdownProps) => {
  const value = values?.[0]?.value || '';

  const safeHtml = useMemo(() => {
    const html = markdownParser.render(value);
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        a: ['href', 'name', 'target'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
      },
    });
  }, [value]);

  return (
    <MetadataCard>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      <dd>
        {/* Allow inserting html since it's sanitized */}
        {/* eslint-disable-next-line react/no-danger */}
        <div className="no-tailwind" dangerouslySetInnerHTML={{ __html: safeHtml }} />
      </dd>
    </MetadataCard>
  );
};

export { Markdown };
