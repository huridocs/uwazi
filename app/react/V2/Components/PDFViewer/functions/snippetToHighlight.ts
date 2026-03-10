import sanitizeHtml from 'sanitize-html';

interface Snippet {
  text: string;
  page: number;
  filename?: string;
}

const SNIPPET_CONTEXT_CLASS = 'snippet-context';
const SEARCH_TERM_CLASS = 'snippet-search-term';
const SNIPPET_CONTEXT_BACKGROUND = 'rgba(247, 168, 168, 1)';
const SEARCH_TERM_BACKGROUND = 'rgba(255, 74, 74, 0.6)';

const textToMatcherRegExp = (text: string): string => {
  const sanitized = sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} });
  return sanitized
    .replace(/…/g, '...')
    .replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
    .replace(/\s+/g, '\\s*')
    .replace(/\n/g, '\\s*');
};

const extractSearchTerms = (snippetText: string): string[] => {
  const rawMatches = snippetText.match(/<b>(.|\n)*?<\/b>/g);
  const sanitized = rawMatches
    ? rawMatches.map(match => sanitizeHtml(match, { allowedTags: [], allowedAttributes: {} }))
    : [];
  return sanitized;
};

// eslint-disable-next-line max-statements
const wrapTextWithMark = (
  text: string,
  matchStart: number,
  matchLength: number,
  className: string
): DocumentFragment => {
  const fragment = document.createDocumentFragment();
  const before = text.slice(0, matchStart);
  const matchText = text.slice(matchStart, matchStart + matchLength);
  const after = text.slice(matchStart + matchLength);

  if (before) {
    fragment.appendChild(document.createTextNode(before));
  }

  const mark = document.createElement('mark');
  mark.className = className;
  mark.style.backgroundColor = SEARCH_TERM_BACKGROUND;
  mark.textContent = matchText;
  fragment.appendChild(mark);

  if (after) {
    fragment.appendChild(document.createTextNode(after));
  }

  return fragment;
};

// eslint-disable-next-line max-statements
const highlightTextInNode = (textNode: Text, searchText: string, className: string): void => {
  const parent = textNode.parentNode;

  if (!parent) {
    return;
  }

  const text = textNode.textContent || '';

  const index = text.toLowerCase().indexOf(searchText.toLowerCase());

  if (index === -1) {
    return;
  }

  parent.replaceChild(wrapTextWithMark(text, index, searchText.length, className), textNode);

  const lastNode = parent.childNodes[parent.childNodes.length - 1];

  if (lastNode?.nodeType === Node.TEXT_NODE) {
    highlightTextInNode(lastNode as Text, searchText, className);
  }
};

const highlightText = (container: HTMLElement, searchText: string, className: string): void => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  let node = walker.nextNode();

  while (node) {
    if (node.textContent?.trim()) {
      highlightTextInNode(node as Text, searchText, className);
    }
    node = walker.nextNode();
  }
};

// eslint-disable-next-line max-statements
const highlightRegex = (
  container: HTMLElement,
  pattern: RegExp,
  className: string
): HTMLElement[] => {
  const match = pattern.exec(container.textContent || '');
  if (!match) {
    return [];
  }

  const markedSpans = new Set<HTMLElement>();
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const matchStart = match.index;
  const matchEnd = match.index + match[0].length;
  let currentPos = 0;
  let node = walker.nextNode();

  while (node) {
    const nodeEnd = currentPos + (node.textContent || '').length;

    if (nodeEnd > matchStart && currentPos < matchEnd && node.parentNode) {
      const parent = node.parentNode as HTMLElement;
      if (parent.classList) {
        parent.classList.add(className);
        parent.style.backgroundColor = SNIPPET_CONTEXT_BACKGROUND;
        markedSpans.add(parent);
      }
    }

    currentPos = nodeEnd;
    node = walker.nextNode();
  }

  return Array.from(markedSpans);
};

const highlightSearchTermsInSpans = (spans: HTMLElement[], searchTerms: string[]): void => {
  if (spans.length === 0) {
    return;
  }

  spans.forEach(span => {
    searchTerms.forEach(term => highlightText(span, term, SEARCH_TERM_CLASS));
  });
};

const tryHighlightWithFuzzyMatch = (
  textLayer: HTMLElement,
  snippetText: string,
  searchTerms: string[]
): boolean => {
  // Try with 15 chars first, then 10 if that fails
  const chunkLengths = [15, 10];

  return chunkLengths.some(chunkLength => {
    const startText = textToMatcherRegExp(snippetText.substring(0, chunkLength));
    const endText = textToMatcherRegExp(snippetText.substring(snippetText.length - chunkLength));

    const fuzzyPattern = `${startText}.{1,200}${endText}`;

    const markedSpans = highlightRegex(
      textLayer,
      new RegExp(fuzzyPattern, 'i'),
      SNIPPET_CONTEXT_CLASS
    );
    if (markedSpans.length > 0) {
      highlightSearchTermsInSpans(markedSpans, searchTerms);
      return true;
    }

    return false;
  });
};

const clearSnippets = (container: HTMLElement | null): void => {
  if (!container) {
    return;
  }

  container.querySelectorAll(`.${SNIPPET_CONTEXT_CLASS}`)?.forEach(el => {
    const element = el as HTMLElement;
    element.classList.remove(SNIPPET_CONTEXT_CLASS);
    element.style.backgroundColor = '';
  });

  container.querySelectorAll('mark')?.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      const children = Array.from(mark.childNodes);
      children.forEach(child => parent.insertBefore(child, mark));
      parent.removeChild(mark);
    }
  });
};

const performHighlighting = (
  textLayer: HTMLElement,
  snippet: Snippet,
  searchTerms: string[]
): void => {
  const contextPattern = textToMatcherRegExp(snippet.text);
  const markedSpans = highlightRegex(
    textLayer,
    new RegExp(contextPattern, 'i'),
    SNIPPET_CONTEXT_CLASS
  );

  if (markedSpans.length > 0) {
    highlightSearchTermsInSpans(markedSpans, searchTerms);
  } else if (searchTerms.length > 0) {
    tryHighlightWithFuzzyMatch(textLayer, snippet.text, searchTerms);
  }
};

const highlightSnippetInPage = (container: HTMLElement | null, snippet: Snippet): void => {
  if (!container || !snippet.text) {
    return;
  }

  clearSnippets(container);

  const textLayer = container.querySelector('.textLayer') as HTMLElement;

  if (!textLayer) {
    return;
  }

  const searchTerms = extractSearchTerms(snippet.text);
  performHighlighting(textLayer, snippet, searchTerms);
};

export { clearSnippets, highlightSnippetInPage };
