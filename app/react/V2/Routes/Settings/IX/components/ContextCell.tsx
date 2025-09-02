import React from 'react';
import { Truncate } from 'V2/Components/UI';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import sanitizeHtml from 'sanitize-html';

const ixContextClassnames: { [key: string]: string } = {
  ix_paragraph: 'ix_paragraph',
  ix_adjacent_paragraph: 'ix_adjacent_paragraph',
  ix_matching_paragraph: 'ix_matching_paragraph',
  ix_match: 'ix_match',
};

const createNode = (node: ChildNode, key: number): React.ReactNode => {
  if (node.type === 'text') {
    return node.data;
  }

  if (node.type === 'tag') {
    const element = node;

    const classNames = ixContextClassnames[element.attribs.class] || '';

    const props: { key: number; className: string } = { key, className: classNames };
    return React.createElement(
      element.name,
      props,
      element.children && element.children.map((child, i) => createNode(child, i))
    );
  }

  return '';
};

const ContextCell = ({ text }: { text: string }) => {
  const sanitized = sanitizeHtml(text, {
    allowedTags: ['p', 'span'],
    allowedAttributes: { p: ['class'], span: ['class'] },
  });

  const document = parseDocument(sanitized);

  const isHTML = Boolean(document.children?.find(child => child.type === 'tag'));

  if (!isHTML) {
    return (
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs text-gray-500">
        {sanitized}
      </Truncate>
    );
  }

  if (isHTML) {
    return <>{document.children.map((node, i) => createNode(node, i))}</>;
  }

  return undefined;
};

export { ContextCell };
