import React from 'react';
import { ChildNode } from 'domhandler';
import {
  BASE_CONTEXT,
  extractTextContent,
  optimizeTextForDisplay,
  calculateOptimalContextLength,
  analyzeContentForTruncation,
} from '../helpers/contextHelpers.js';

const ixContextClassnames: { [key: string]: string } = {
  ix_paragraph: 'ix_paragraph text-ink-muted',
  ix_adjacent_paragraph: 'ix_adjacent_paragraph text-ink-secondary',
  ix_matching_paragraph: 'ix_matching_paragraph px-1 text-ink',
  ix_match: 'ix_match bg-highlight text-ink',
};

const elementClass = (node: React.ReactNode) =>
  React.isValidElement(node) ? (node.props as { className?: string }).className : undefined;

const isClass = (node: React.ReactNode, className: string) => elementClass(node) === className;

const recreate = (node: React.ReactElement<any>, children: React.ReactNode, key?: number) => {
  const elementType = node.type === 'p' ? 'span' : node.type;
  return React.createElement(
    elementType,
    key === undefined ? { className: elementClass(node) } : { key, className: elementClass(node) },
    children
  );
};

const matchChildIndexes = (childrenArray: React.ReactNode[]) => {
  const first = childrenArray.findIndex(child => isClass(child, ixContextClassnames.ix_match));
  if (first === -1) {
    return undefined;
  }
  const last =
    [...childrenArray.keys()]
      .reverse()
      .find(index => isClass(childrenArray[index], ixContextClassnames.ix_match)) ?? first;
  return { first, last };
};

const buildTruncatedMatch = ({
  childrenArray,
  range,
  beforeText,
  afterText,
  matchingText,
}: {
  childrenArray: React.ReactNode[];
  range: { first: number; last: number };
  beforeText: string;
  afterText: string;
  matchingText: string;
}) => {
  const maxContext = calculateOptimalContextLength(matchingText, beforeText, afterText);
  const beforeContext = Math.min(beforeText.length, Math.floor(maxContext * 0.4));
  const afterContext = Math.min(afterText.length, Math.floor(maxContext * 0.6));
  return [
    beforeText.length > 0
      ? `${beforeText.length > beforeContext ? '...' : ''}${beforeText.slice(-beforeContext)} `
      : '',
    ...childrenArray.slice(range.first, range.last + 1),
    afterText.length > 0
      ? ` ${afterText.slice(0, afterContext)}${afterText.length > afterContext ? '...' : ''}`
      : '',
  ];
};

const truncateMatching = (matchingParagraph: React.ReactElement<any>) => {
  const childrenArray = React.Children.toArray(matchingParagraph.props.children);
  const range = matchChildIndexes(childrenArray);
  if (!range) {
    return matchingParagraph;
  }
  const beforeText = optimizeTextForDisplay(
    childrenArray.slice(0, range.first).map(extractTextContent).join('')
  );
  const afterText = optimizeTextForDisplay(
    childrenArray
      .slice(range.last + 1)
      .map(extractTextContent)
      .join('')
  );
  const matchingText = optimizeTextForDisplay(
    childrenArray
      .slice(range.first, range.last + 1)
      .map(extractTextContent)
      .join('')
  );
  return buildTruncatedMatch({ childrenArray, range, beforeText, afterText, matchingText });
};

const truncateFirstNode = (nodes: React.ReactNode[]) => {
  const [firstNode] = nodes;
  if (!React.isValidElement(firstNode)) {
    return nodes;
  }
  const textContent = extractTextContent(firstNode);
  if (!textContent) {
    return nodes;
  }
  const optimizedText = optimizeTextForDisplay(textContent);
  const truncatedText =
    optimizedText.length > BASE_CONTEXT
      ? `${optimizedText.slice(0, BASE_CONTEXT)}...`
      : optimizedText;
  return recreate(firstNode, truncatedText);
};

const truncateAdjacent = (node: React.ReactElement<any>, index: number, maxContext: number) => {
  const textContent = extractTextContent(node);
  const optimizedText = optimizeTextForDisplay(textContent);
  const maxAdjacentLength = Math.floor(maxContext * 0.5);
  if (optimizedText.length > maxAdjacentLength) {
    return recreate(node, `${optimizedText.slice(0, maxAdjacentLength)}...`, index);
  }
  if (optimizedText !== textContent) {
    return recreate(node, optimizedText, index);
  }
  return node;
};

const rewriteContextNode = (node: React.ReactNode, index: number, maxContext: number) => {
  if (React.isValidElement(node) && isClass(node, ixContextClassnames.ix_matching_paragraph)) {
    return recreate(node, truncateMatching(node), index);
  }
  if (React.isValidElement(node) && isClass(node, ixContextClassnames.ix_adjacent_paragraph)) {
    return truncateAdjacent(node, index, maxContext);
  }
  return node;
};

const adjacentOf = (nodes: React.ReactNode[], matchingIndex: number, after: boolean) => {
  const slice = after ? nodes.slice(matchingIndex + 1) : nodes.slice(0, matchingIndex);
  return slice
    .filter(node => isClass(node, ixContextClassnames.ix_adjacent_paragraph))
    .slice(after ? 0 : -1, after ? 1 : undefined);
};

const matchingContextLength = (
  matchingParagraph: React.ReactElement<any>,
  beforeText: string,
  afterText: string
) => {
  const matchingText = optimizeTextForDisplay(extractTextContent(matchingParagraph));
  const contentAnalysis = analyzeContentForTruncation(extractTextContent(matchingParagraph));
  return contentAnalysis.hasLongContent
    ? contentAnalysis.optimalLength
    : calculateOptimalContextLength(matchingText, beforeText, afterText);
};

const truncateMatchedNodes = (
  nodes: React.ReactNode[],
  matchingIndex: number,
  matchingParagraph: React.ReactElement<any>
) => {
  const adjacentBefore = adjacentOf(nodes, matchingIndex, false);
  const adjacentAfter = adjacentOf(nodes, matchingIndex, true);
  const beforeText =
    adjacentBefore.length > 0 ? optimizeTextForDisplay(extractTextContent(adjacentBefore[0])) : '';
  const afterText =
    adjacentAfter.length > 0 ? optimizeTextForDisplay(extractTextContent(adjacentAfter[0])) : '';
  const maxContext = matchingContextLength(matchingParagraph, beforeText, afterText);
  const contextNodes = [...adjacentBefore, matchingParagraph, ...adjacentAfter];
  if (contextNodes.length > 1) {
    return contextNodes.map((node, index) => rewriteContextNode(node, index, maxContext));
  }
  return recreate(matchingParagraph, truncateMatching(matchingParagraph));
};

const truncateNodes = (nodes: React.ReactNode[]) => {
  const matchingIndex = nodes.findIndex(node =>
    isClass(node, ixContextClassnames.ix_matching_paragraph)
  );
  const matchingParagraph = nodes[matchingIndex];
  if (matchingIndex === -1 || !React.isValidElement(matchingParagraph)) {
    return truncateFirstNode(nodes);
  }
  return truncateMatchedNodes(nodes, matchingIndex, matchingParagraph);
};

const filterNodes = (nodes: React.ReactNode[]) => {
  const hasMatches = nodes.some(node => isClass(node, ixContextClassnames.ix_match));
  if (!hasMatches) {
    return nodes;
  }
  return nodes.filter(
    node =>
      !isClass(node, ixContextClassnames.ix_adjacent_paragraph) &&
      !isClass(node, ixContextClassnames.ix_paragraph)
  );
};

const createDomNode = (
  node: ChildNode,
  key: number,
  paragraphsAsSpan: boolean
): React.ReactNode => {
  if (node.type === 'text') {
    return node.data;
  }
  if (node.type !== 'tag') {
    return undefined;
  }
  const tagName = paragraphsAsSpan && node.name === 'p' ? 'span' : node.name;
  return React.createElement(
    tagName,
    { key, className: ixContextClassnames[node.attribs.class] || '' },
    node.children?.map((child, i) => createDomNode(child, i, paragraphsAsSpan))
  );
};

export { createDomNode, filterNodes, truncateNodes };
