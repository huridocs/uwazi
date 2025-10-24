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

export const calculateOptimalProportions = (suggestions: TableSuggestion[]) => {
  const hasLongTitles = suggestions.some(s => (s.entityTitle?.length || 0) > 25);
  const hasLongValues = suggestions.some(s => {
    const currentLength = s.currentValue ? String(s.currentValue).length : 0;
    const suggestedLength = s.suggestedValue ? String(s.suggestedValue).length : 0;
    return Math.max(currentLength, suggestedLength) > 15;
  });
  const hasLongContext = suggestions.some(s => (s.segment?.length || 0) > 150);

  let finalTitleWidth = 'w-1/5 min-w-[120px]';
  let finalContextWidth = 'w-2/5';
  let finalValueWidth = 'w-2/5';

  if (hasLongValues && hasLongContext && hasLongTitles) {
    finalTitleWidth = 'w-1/4 min-w-[150px]';
    finalContextWidth = 'w-1/3';
    finalValueWidth = 'w-5/12';
  } else if (hasLongValues && hasLongContext) {
    finalTitleWidth = 'w-1/6 min-w-[100px]';
    finalContextWidth = 'w-2/5';
    finalValueWidth = 'w-2/5';
  } else if (hasLongValues && hasLongTitles) {
    finalTitleWidth = 'w-1/4 min-w-[150px]';
    finalContextWidth = 'w-1/6';
    finalValueWidth = 'w-7/12';
  } else if (hasLongContext && hasLongTitles) {
    finalTitleWidth = 'w-1/4 min-w-[150px]';
    finalContextWidth = 'w-7/12';
    finalValueWidth = 'w-1/6';
  } else if (hasLongContext) {
    finalTitleWidth = 'w-1/4';
    finalContextWidth = 'w-1/2 min-w-[200px]';
    finalValueWidth = 'w-1/4';
  } else if (hasLongValues) {
    finalTitleWidth = 'w-1/4';
    finalContextWidth = 'w-1/4';
    finalValueWidth = 'w-1/2 min-w-[200px]';
  } else if (hasLongTitles) {
    finalTitleWidth = 'w-1/2 min-w-[200px]';
    finalContextWidth = 'w-1/4';
    finalValueWidth = 'w-1/4';
  } else {
    finalTitleWidth = 'w-1/6 min-w-[100px]';
    finalContextWidth = 'w-2/5';
    finalValueWidth = 'w-2/5';
  }

  return {
    titleWidth: finalTitleWidth,
    contextWidth: finalContextWidth,
    valueWidth: finalValueWidth,
  };
};
