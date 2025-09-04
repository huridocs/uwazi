import React, { useMemo } from 'react';
import { Truncate } from 'V2/Components/UI';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import sanitizeHtml from 'sanitize-html';
import { Tooltip } from 'flowbite-react';

const ixContextClassnames: { [key: string]: string } = {
  ix_paragraph: 'ix_paragraph text-gray-500',
  ix_adjacent_paragraph: 'ix_adjacent_paragraph text-gray-700',
  ix_matching_paragraph: 'ix_matching_paragraph text-black',
  ix_match: 'ix_match bg-[#FFE29A] text-black',
};

const MAX_CONTEXT = 20;

const truncateMatching = (matchingParagraph: React.ReactElement) => {
  const childrenArray = React.Children.toArray(matchingParagraph.props.children);
  const matchIndex = childrenArray.findIndex(
    child => React.isValidElement(child) && child.props.className === ixContextClassnames.ix_match
  );

  if (matchIndex === -1) {
    return matchingParagraph;
  }

  const before = childrenArray
    .slice(0, matchIndex)
    .reverse()
    .find(child => typeof child === 'string' && child.trim()) as string | undefined;

  const after = childrenArray
    .slice(matchIndex + 1)
    .find(child => typeof child === 'string' && child.trim()) as string | undefined;

  return [
    before ? `...${before.slice(-MAX_CONTEXT)} ` : '...',
    childrenArray[matchIndex],
    after ? ` ${after.slice(0, MAX_CONTEXT)}...` : '...',
  ];
};

const truncateNodes = (nodes: React.ReactNode[]) => {
  const matchingParagraph = nodes.find(
    node =>
      React.isValidElement(node) &&
      node.props.className === ixContextClassnames.ix_matching_paragraph
  );

  if (!matchingParagraph || !React.isValidElement(matchingParagraph)) {
    const [firstNode] = nodes;
    const [text] = React.isValidElement(firstNode) ? (firstNode.props.children as string) : [''];

    if (text) {
      return React.cloneElement(
        firstNode as React.ReactElement,
        {},
        `${text.slice(0, MAX_CONTEXT)}...`
      );
    }

    return nodes;
  }

  const trucatedHTML = truncateMatching(matchingParagraph);
  return React.cloneElement(matchingParagraph, {}, trucatedHTML);
};

const filterNodes = (nodes: React.ReactNode[]) => {
  const hasMatches = Boolean(
    nodes.find(
      node => React.isValidElement(node) && node.props.className === ixContextClassnames.ix_match
    )
  );

  if (hasMatches) {
    return nodes.filter(node => {
      if (
        React.isValidElement(node) &&
        (node.props.className === ixContextClassnames.ix_adjacent_paragraph ||
          node.props.className === ixContextClassnames.ix_paragraph)
      ) {
        return false;
      }
      return true;
    });
  }

  return nodes;
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

  const { fullHTML, truncatedHTML } = useMemo(() => {
    const nodes = document.children.map((node, i) => createNode(node, i));
    return { fullHTML: nodes, truncatedHTML: truncateNodes(filterNodes(nodes)) };
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
    return (
      <Tooltip
        content={fullHTML}
        arrow
        animation="duration-100"
        // eslint-disable-next-line react/style-prop-object
        style="light"
        className="shadow-xl"
      >
        <div className="pointer-events-auto cursor-pointer">{truncatedHTML}</div>
      </Tooltip>
    );
  }

  return undefined;
};

export { ContextCell };
