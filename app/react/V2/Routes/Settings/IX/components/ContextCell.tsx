import React, { useMemo } from 'react';
import { parseDocument } from 'htmlparser2';
import sanitizeHtml from 'sanitize-html';
import { Tooltip, Truncate } from '#V2/Components/UI/index.js';
import { createDomNode, filterNodes, truncateNodes } from './contextCellHtml.js';

const ContextCell = ({ text }: { text: string }) => {
  const document = useMemo(
    () =>
      parseDocument(
        sanitizeHtml(text, {
          allowedTags: ['p', 'span'],
          allowedAttributes: { p: ['class'], span: ['class'] },
        })
      ),
    [text]
  );

  const { fullHTML, truncatedHTML } = useMemo(() => {
    const nodes = document.children.map((node, i) => createDomNode(node, i, true));
    const originalNodes = document.children.map((node, i) => createDomNode(node, i, false));
    return { fullHTML: originalNodes, truncatedHTML: truncateNodes(filterNodes(nodes)) };
  }, [document]);

  const isHTML = useMemo(
    () => Boolean(document.children?.find(child => child.type === 'tag')),
    [document]
  );

  if (!isHTML) {
    return (
      <Truncate
        maxLength={100}
        ellipsisPosition="center"
        tooltipClassname="text-xs inline-block w-[40vw] max-w-[500px] min-w-32 whitespace-normal text-ink-secondary"
      >
        {text}
      </Truncate>
    );
  }

  return (
    <Tooltip
      content={
        <div className="text-xs inline-block w-[40vw] max-w-125 min-w-32 whitespace-normal text-ink-secondary">
          {fullHTML}
        </div>
      }
      arrow
      animation="duration-100"
      className="shadow-xl z-9999"
    >
      <div className="pointer-events-auto cursor-pointer">{truncatedHTML}</div>
    </Tooltip>
  );
};

export { ContextCell };
