import React, { useMemo } from 'react';
import { Truncate } from 'V2/Components/UI';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import sanitizeHtml from 'sanitize-html';

const ixContextClassnames: { [key: string]: string } = {
  ix_paragraph: 'ix_paragraph text-gray-700',
  ix_adjacent_paragraph: 'ix_adjacent_paragraph text-gray-700',
  ix_matching_paragraph: 'ix_matching_paragraph text-gray-900',
  ix_match: 'ix_match text-orange-600',
};

const truncatedNodes = (nodes: React.ReactNode[]) => {
  let matchingParagraph;

  const matchingWordsSpan = nodes.find(node => {
    if (React.isValidElement(node)) {
      if (node.props.className === ixContextClassnames.ix_match) {
        return node;
      }
    }
    return undefined;
  });
};

const filterNodes = (nodes: React.ReactNode[]) =>
  nodes.filter(node => {
    if (React.isValidElement(node)) {
      if (node.props.className === ixContextClassnames.ix_adjacent_paragraph) {
        return false;
      }
    }
    return true;
  });

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

  return undefined;
};

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

  const filteredNodes = useMemo(() => {
    const nodes = document.children.map((node, i) => createNode(node, i));
    return filterNodes(nodes);
  }, [document]);

  const isHTML = useMemo(
    () => Boolean(document.children?.find(child => child.type === 'tag')),
    [document]
  );

  if (!isHTML) {
    return (
      <Truncate maxLength={100} ellipsisPosition="center" tooltipClassname="text-xs text-gray-500">
        {text}
      </Truncate>
    );
  }

  if (isHTML) {
    return <>{filteredNodes}</>;
  }

  return undefined;
};

export { ContextCell };
