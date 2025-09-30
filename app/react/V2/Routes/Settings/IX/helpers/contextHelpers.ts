import React from 'react';
import sanitizeHtml from 'sanitize-html';
import { parseDocument } from 'htmlparser2';

import { TableSuggestion } from '../types';

export const BASE_CONTEXT = 50;

export const extractTextContent = (node: React.ReactNode): string => {
  if (typeof node === 'string') {
    return node;
  }
  if (typeof node === 'number') {
    return node.toString();
  }
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props.children) {
      return React.Children.toArray(props.children).map(extractTextContent).join('');
    }
  }
  return '';
};

export const optimizeTextForDisplay = (text: string): string =>
  text.replace(/[\n\r\t\s]/g, ' ').trim();

export const calculateOptimalContextLength = (
  matchingText: string,
  adjacentBefore: string,
  adjacentAfter: string,
  availableWidth?: number
): number => {
  let maxContext = BASE_CONTEXT;

  if (availableWidth) {
    const estimatedCharsPerPixel = 8;
    const maxCharsForWidth = Math.floor(availableWidth / estimatedCharsPerPixel);
    maxContext = Math.min(maxContext, maxCharsForWidth);
  }

  if (matchingText.length <= 20) {
    maxContext += 30;
  }

  if (adjacentBefore.length <= 50) {
    maxContext += 20;
  }

  if (adjacentAfter.length <= 50) {
    maxContext += 20;
  }

  if (adjacentBefore.length <= 25 && adjacentAfter.length <= 25) {
    maxContext += 40;
  }

  return Math.min(maxContext, 150);
};

function extractTextFromHtml(html: string): string {
  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });

  const document = parseDocument(sanitizedHtml);

  const extractTextFromNode = (node: any): string => {
    if (node.type === 'text') {
      return node.data || '';
    }
    if (node.children) {
      return node.children.map(extractTextFromNode).join('');
    }
    return '';
  };

  return extractTextFromNode(document);
}

export const analyzeContentForTruncation = (
  htmlContent: string
): {
  shouldTruncate: boolean;
  optimalLength: number;
  hasLongContent: boolean;
} => {
  const textLength = extractTextFromHtml(htmlContent).length;
  const hasLongContent = textLength > 200;
  const shouldTruncate = textLength > 100 || hasLongContent;
  let optimalLength = BASE_CONTEXT;

  if (hasLongContent) {
    optimalLength = Math.min(BASE_CONTEXT * 0.8, 80);
  } else if (textLength < 50) {
    optimalLength = Math.min(textLength, BASE_CONTEXT * 1.5);
  }

  return {
    shouldTruncate,
    optimalLength,
    hasLongContent,
  };
};

export const analyzeContentWidths = (suggestions: TableSuggestion[]) => {
  if (!suggestions || suggestions.length === 0) {
    return {
      titleWidth: 'w-1/5 min-w-[120px]',
      contextWidth: 'w-2/5',
      valueWidth: 'w-2/5',
    };
  }

  const titleLengths = suggestions.map(s => s.entityTitle?.length || 0);
  const avgTitleLength = titleLengths.reduce((a, b) => a + b, 0) / titleLengths.length;
  const maxTitleLength = Math.max(...titleLengths);

  const valueLengths = suggestions.map(s => {
    const currentLength = s.currentValue ? String(s.currentValue).length : 0;
    const suggestedLength = s.suggestedValue ? String(s.suggestedValue).length : 0;
    return Math.max(currentLength, suggestedLength);
  });
  const avgValueLength = valueLengths.reduce((a, b) => a + b, 0) / valueLengths.length;
  const maxValueLength = Math.max(...valueLengths);
  const minValueLength = Math.min(...valueLengths);

  const hasVeryShortValues = avgValueLength <= 10 || minValueLength <= 5;
  const hasShortValues = avgValueLength <= 20 || maxValueLength <= 15;
  const contextLengths = suggestions.map(s => s.segment?.length || 0);
  const avgContextLength = contextLengths.reduce((a, b) => a + b, 0) / contextLengths.length;

  const hasNoContext = suggestions.some(
    s =>
      !s.segment || s.segment === 'No context' || s.segment.trim() === '' || s.segment.length < 10
  );

  const hasNoValues = suggestions.some(
    s =>
      (!s.currentValue || s.currentValue === '-') && (!s.suggestedValue || s.suggestedValue === '-')
  );

  let titleWidth;
  let contextWidth;
  let valueWidth;

  if (hasNoContext && hasNoValues) {
    titleWidth = 'w-1/3 min-w-[200px]';
    contextWidth = 'w-1/4';
    valueWidth = 'w-1/4';
  } else if (hasNoContext) {
    titleWidth = 'w-1/4 min-w-[150px]';
    contextWidth = 'w-1/6';
    valueWidth = 'w-1/2';
  } else if (hasNoValues) {
    titleWidth = 'w-1/4 min-w-[150px]';
    contextWidth = 'w-1/2';
    valueWidth = 'w-1/6';
  } else if (hasVeryShortValues) {
    titleWidth = 'w-1/6 min-w-[100px]';
    contextWidth = 'w-3/5';
    valueWidth = 'w-1/6';
  } else if (hasShortValues) {
    titleWidth = 'w-1/6 min-w-[100px]';
    contextWidth = 'w-1/2';
    valueWidth = 'w-1/3';
  } else if (maxValueLength > 20 || avgValueLength > 15) {
    titleWidth = 'w-1/6 min-w-[100px]';
    contextWidth = 'w-2/5';
    valueWidth = 'w-2/5';
  } else if (maxTitleLength > 30 || avgTitleLength > 20) {
    titleWidth = 'w-1/4 min-w-[150px]';
    contextWidth = 'w-3/8';
    valueWidth = 'w-3/8';
  } else if (avgContextLength > 200) {
    titleWidth = 'w-1/6 min-w-[80px]';
    contextWidth = 'w-2/5';
    valueWidth = 'w-2/5';
  } else {
    titleWidth = 'w-1/5 min-w-[120px]';
    contextWidth = 'w-2/5';
    valueWidth = 'w-2/5';
  }

  return { titleWidth, contextWidth, valueWidth };
};

export const calculateOptimalProportions = (suggestions: TableSuggestion[]) => {
  const { titleWidth, contextWidth, valueWidth } = analyzeContentWidths(suggestions);

  const hasLongTitles = suggestions.some(s => (s.entityTitle?.length || 0) > 25);
  const hasLongValues = suggestions.some(s => {
    const currentLength = s.currentValue ? String(s.currentValue).length : 0;
    const suggestedLength = s.suggestedValue ? String(s.suggestedValue).length : 0;
    return Math.max(currentLength, suggestedLength) > 15;
  });
  const hasShortValues = suggestions.some(s => {
    const currentLength = s.currentValue ? String(s.currentValue).length : 0;
    const suggestedLength = s.suggestedValue ? String(s.suggestedValue).length : 0;
    return Math.max(currentLength, suggestedLength) <= 10;
  });
  const hasVeryShortValues = suggestions.some(s => {
    const currentLength = s.currentValue ? String(s.currentValue).length : 0;
    const suggestedLength = s.suggestedValue ? String(s.suggestedValue).length : 0;
    return Math.max(currentLength, suggestedLength) <= 5;
  });
  const hasLongContext = suggestions.some(s => (s.segment?.length || 0) > 150);
  const hasNoContext = suggestions.some(
    s =>
      !s.segment || s.segment === 'No context' || s.segment.trim() === '' || s.segment.length < 10
  );
  const hasNoValues = suggestions.some(
    s =>
      (!s.currentValue || s.currentValue === '-') && (!s.suggestedValue || s.suggestedValue === '-')
  );

  let finalTitleWidth = titleWidth;
  let finalContextWidth = contextWidth;
  let finalValueWidth = valueWidth;

  if (hasNoContext && hasNoValues) {
    finalTitleWidth = 'w-1/3 min-w-[200px]';
    finalContextWidth = 'w-1/4';
    finalValueWidth = 'w-1/4';
  } else if (hasNoContext) {
    finalTitleWidth = 'w-1/4 min-w-[150px]';
    finalContextWidth = 'w-1/6';
    finalValueWidth = 'w-1/2';
  } else if (hasNoValues) {
    finalTitleWidth = 'w-1/4 min-w-[150px]';
    finalContextWidth = 'w-1/2';
    finalValueWidth = 'w-1/6';
  } else if (hasVeryShortValues) {
    finalTitleWidth = 'w-1/6 min-w-[100px]';
    finalContextWidth = 'w-3/5';
    finalValueWidth = 'w-1/6';
  } else if (hasShortValues) {
    finalTitleWidth = 'w-1/6 min-w-[100px]';
    finalContextWidth = 'w-1/2';
    finalValueWidth = 'w-1/3';
  } else if (hasLongTitles && !hasLongContext) {
    finalTitleWidth = 'w-1/4 min-w-[150px]';
    finalContextWidth = 'w-3/8';
    finalValueWidth = 'w-3/8';
  } else if (hasLongValues) {
    finalTitleWidth = 'w-1/6 min-w-[100px]';
    finalContextWidth = 'w-2/5';
    finalValueWidth = 'w-2/5';
  } else if (hasLongContext) {
    finalTitleWidth = 'w-1/6 min-w-[80px]';
    finalContextWidth = 'w-2/5';
    finalValueWidth = 'w-2/5';
  }

  return {
    titleWidth: finalTitleWidth,
    contextWidth: finalContextWidth,
    valueWidth: finalValueWidth,
  };
};
