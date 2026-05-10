import React, { useMemo } from 'react';
import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';

type MarkdownProps = MetadataFieldProps & {
  values: {
    value: string;
  }[];
};

const markdownParser = new MarkdownIt({ html: true });

const sanitizeOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    a: ['href', 'name', 'target'],
    img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
  },
};

const Markdown = ({ label, translationContext, values, hideLabel }: MarkdownProps) => {
  const safeHtmlList = useMemo(
    () =>
      (values ?? [])
        .map(v => sanitizeHtml(markdownParser.render(v.value || ''), sanitizeOptions))
        .filter(html => html !== ''),
    [values]
  );

  if (safeHtmlList.length === 0) {
    return null;
  }

  return (
    <MetadataCard>
      <dt>
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      </dt>
      <dd className="flex flex-col gap-1">
        {safeHtmlList.map((safeHtml, index) => (
          // eslint-disable-next-line react/no-array-index-key, react/no-danger
          <div key={index} className="no-tailwind" dangerouslySetInnerHTML={{ __html: safeHtml }} />
        ))}
      </dd>
    </MetadataCard>
  );
};

export { Markdown };
