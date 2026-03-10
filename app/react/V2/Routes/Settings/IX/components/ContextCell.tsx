import React, { useMemo } from 'react';
import { Truncate } from 'V2/Components/UI';
import { parseDocument } from 'htmlparser2';
import { ChildNode } from 'domhandler';
import sanitizeHtml from 'sanitize-html';
import { Tooltip } from 'flowbite-react';
import {
  BASE_CONTEXT,
  extractTextContent,
  optimizeTextForDisplay,
  calculateOptimalContextLength,
  analyzeContentForTruncation,
} from '../helpers/contextHelpers';

const ixContextClassnames: { [key: string]: string } = {
  ix_paragraph: 'ix_paragraph text-gray-500',
  ix_adjacent_paragraph: 'ix_adjacent_paragraph text-gray-700',
  ix_matching_paragraph: 'ix_matching_paragraph text-black px-1',
  ix_match: 'ix_match bg-[#FFE29A] text-black',
};

const truncateMatching = (matchingParagraph: React.ReactElement) => {
  const childrenArray = React.Children.toArray(matchingParagraph.props.children);
  const matchIndex = childrenArray.findIndex(
    child => React.isValidElement(child) && child.props.className === ixContextClassnames.ix_match
  );

  if (matchIndex === -1) {
    return matchingParagraph;
  }

  const firstMatchIndex = matchIndex;
  const lastMatchIndex =
    childrenArray
      .map((child, index) => ({ child, index }))
      .reverse()
      .find(
        ({ child }) =>
          React.isValidElement(child) &&
          (child.props as { className?: string }).className === ixContextClassnames.ix_match
      )?.index ?? firstMatchIndex;

  const beforeNodes = childrenArray.slice(0, firstMatchIndex);
  const afterNodes = childrenArray.slice(lastMatchIndex + 1);

  const beforeText = optimizeTextForDisplay(beforeNodes.map(extractTextContent).join(''));
  const afterText = optimizeTextForDisplay(afterNodes.map(extractTextContent).join(''));
  const matchingText = optimizeTextForDisplay(
    childrenArray
      .slice(firstMatchIndex, lastMatchIndex + 1)
      .map(extractTextContent)
      .join('')
  );

  const maxContext = calculateOptimalContextLength(matchingText, beforeText, afterText);

  const beforeContext = Math.min(beforeText.length, Math.floor(maxContext * 0.4));
  const afterContext = Math.min(afterText.length, Math.floor(maxContext * 0.6));

  const beforeEllipsis = beforeText.length > beforeContext ? '...' : '';
  const afterEllipsis = afterText.length > afterContext ? '...' : '';

  return [
    beforeText.length > 0 ? `${beforeEllipsis}${beforeText.slice(-beforeContext)} ` : '',
    ...childrenArray.slice(firstMatchIndex, lastMatchIndex + 1), // Include all match spans
    afterText.length > 0 ? ` ${afterText.slice(0, afterContext)}${afterEllipsis}` : '',
  ];
};

const truncateNodes = (nodes: React.ReactNode[]) => {
  const matchingParagraph = nodes.find(
    node =>
      React.isValidElement(node) &&
      (node.props as { className?: string }).className === ixContextClassnames.ix_matching_paragraph
  );

  if (!matchingParagraph || !React.isValidElement(matchingParagraph)) {
    const [firstNode] = nodes;
    if (React.isValidElement(firstNode)) {
      const textContent = extractTextContent(firstNode);
      if (textContent) {
        const optimizedText = optimizeTextForDisplay(textContent);
        const truncatedText =
          optimizedText.length > BASE_CONTEXT
            ? `${optimizedText.slice(0, BASE_CONTEXT)}...`
            : optimizedText;
        // Convert to span if it's a p element for better horizontal space usage
        const elementType =
          (firstNode as React.ReactElement).type === 'p'
            ? 'span'
            : (firstNode as React.ReactElement).type;
        return React.createElement(
          elementType,
          { className: (firstNode as React.ReactElement).props.className },
          truncatedText
        );
      }
    }

    return nodes;
  }

  const matchingIndex = nodes.findIndex(
    node =>
      React.isValidElement(node) &&
      (node.props as { className?: string }).className === ixContextClassnames.ix_matching_paragraph
  );

  const adjacentBefore = nodes
    .slice(0, matchingIndex)
    .filter(
      node =>
        React.isValidElement(node) &&
        (node.props as { className?: string }).className ===
          ixContextClassnames.ix_adjacent_paragraph
    )
    .slice(-1);

  const adjacentAfter = nodes
    .slice(matchingIndex + 1)
    .filter(
      node =>
        React.isValidElement(node) &&
        (node.props as { className?: string }).className ===
          ixContextClassnames.ix_adjacent_paragraph
    )
    .slice(0, 1);

  const matchingText = optimizeTextForDisplay(extractTextContent(matchingParagraph));
  const beforeText =
    adjacentBefore.length > 0 ? optimizeTextForDisplay(extractTextContent(adjacentBefore[0])) : '';
  const afterText =
    adjacentAfter.length > 0 ? optimizeTextForDisplay(extractTextContent(adjacentAfter[0])) : '';
  const contentAnalysis = analyzeContentForTruncation(extractTextContent(matchingParagraph));
  const maxContext = contentAnalysis.hasLongContent
    ? contentAnalysis.optimalLength
    : calculateOptimalContextLength(matchingText, beforeText, afterText);
  const shouldIncludeBefore = adjacentBefore.length > 0;
  const shouldIncludeAfter = adjacentAfter.length > 0;
  const contextNodes = [
    ...(shouldIncludeBefore ? adjacentBefore : []),
    matchingParagraph,
    ...(shouldIncludeAfter ? adjacentAfter : []),
  ];
  if (contextNodes.length > 1) {
    return contextNodes.map((node, index) => {
      if (
        React.isValidElement(node) &&
        (node.props as { className?: string }).className ===
          ixContextClassnames.ix_matching_paragraph
      ) {
        const truncatedHTML = truncateMatching(node);
        const elementType = node.type === 'p' ? 'span' : node.type;
        return React.createElement(
          elementType,
          { key: index, className: (node.props as { className?: string }).className },
          truncatedHTML
        );
      }
      if (
        React.isValidElement(node) &&
        (node.props as { className?: string }).className ===
          ixContextClassnames.ix_adjacent_paragraph
      ) {
        const textContent = extractTextContent(node);
        const optimizedText = optimizeTextForDisplay(textContent);
        const maxAdjacentLength = Math.floor(maxContext * 0.5);

        if (optimizedText.length > maxAdjacentLength) {
          const truncatedText = `${optimizedText.slice(0, maxAdjacentLength)}...`;
          const elementType = node.type === 'p' ? 'span' : node.type;
          return React.createElement(
            elementType,
            { key: index, className: (node.props as { className?: string }).className },
            truncatedText
          );
        }

        if (optimizedText !== textContent) {
          const elementType = node.type === 'p' ? 'span' : node.type;
          return React.createElement(
            elementType,
            { key: index, className: (node.props as { className?: string }).className },
            optimizedText
          );
        }
      }

      return node;
    });
  }

  const truncatedHTML = truncateMatching(matchingParagraph);
  const elementType = matchingParagraph.type === 'p' ? 'span' : matchingParagraph.type;
  return React.createElement(
    elementType,
    { className: matchingParagraph.props.className },
    truncatedHTML
  );
};

const filterNodes = (nodes: React.ReactNode[]) => {
  const hasMatches = Boolean(
    nodes.find(
      node =>
        React.isValidElement(node) &&
        (node.props as { className?: string }).className === ixContextClassnames.ix_match
    )
  );

  if (hasMatches) {
    return nodes.filter(node => {
      if (
        React.isValidElement(node) &&
        ((node.props as { className?: string }).className ===
          ixContextClassnames.ix_adjacent_paragraph ||
          (node.props as { className?: string }).className === ixContextClassnames.ix_paragraph)
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

    // Convert p tags to span tags for better horizontal space usage
    const tagName = element.name === 'p' ? 'span' : element.name;

    return React.createElement(
      tagName,
      props,
      element.children && element.children.map((child, i) => createNode(child, i))
    );
  }

  return undefined;
};

const createOriginalNode = (node: ChildNode, key: number): React.ReactNode => {
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
      element.children && element.children.map((child, i) => createOriginalNode(child, i))
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
    const originalNodes = document.children.map((node, i) => createOriginalNode(node, i));
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
        tooltipClassname="text-xs text-gray-700 inline-block w-[40vw] max-w-[500px] min-w-32 whitespace-normal"
      >
        {text}
      </Truncate>
    );
  }

  if (isHTML) {
    return (
      <Tooltip
        content={
          <div className="text-xs text-gray-700 inline-block w-[40vw] max-w-[500px] min-w-32 whitespace-normal">
            {fullHTML}
          </div>
        }
        arrow
        animation="duration-100"
        // eslint-disable-next-line react/style-prop-object
        style="light"
        className="shadow-xl z-[9999]"
      >
        <div className="pointer-events-auto cursor-pointer">{truncatedHTML}</div>
      </Tooltip>
    );
  }

  return undefined;
};

export { ContextCell };
