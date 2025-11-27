interface Snippet {
  text: string;
  page: number;
  filename?: string;
}

const textToMatcherRegExp = (text: string): string =>
  text
    .replace(/…/g, '...')
    .replace(/[-[\]{}()*+?.,\\^$|#]/g, '\\$&')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, '\\s*')
    .replace(/\n/g, '\\s*');

const extractSearchTerms = (snippetText: string): string[] => {
  const rawMatches = snippetText.match(/<b>(.|\n)*?<\/b>/g);
  return rawMatches ? rawMatches.map(m => m.replace(/<.*?>/g, '')) : [];
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

const collectTextNodesFromWalker = (walker: TreeWalker): Text[] => {
  const nodes: Text[] = [];
  let currentNode = walker.nextNode();

  const processNode = (node: Node | null): Node | null => {
    if (node?.textContent?.trim()) {
      nodes.push(node as Text);
    }
    return walker.nextNode();
  };

  while (currentNode) {
    currentNode = processNode(currentNode);
  }

  return nodes;
};

const highlightText = (container: HTMLElement, searchText: string, className: string): void => {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const textNodes = collectTextNodesFromWalker(walker);

  textNodes.forEach(textNode => {
    highlightTextInNode(textNode, searchText, className);
  });
};

const processNodeForRegexMatch = (params: {
  node: Node;
  currentPos: number;
  matchStart: number;
  matchEnd: number;
  className: string;
}) => {
  const { node, currentPos, matchStart, matchEnd, className } = params;
  const nodeText = node.textContent || '';
  const nodeStart = currentPos;
  const nodeEnd = currentPos + nodeText.length;

  if (nodeEnd > matchStart && nodeStart < matchEnd && node.parentNode) {
    const overlapStart = Math.max(0, matchStart - nodeStart);
    const overlapEnd = Math.min(nodeText.length, matchEnd - nodeStart);
    node.parentNode.replaceChild(
      wrapTextWithMark(nodeText, overlapStart, overlapEnd - overlapStart, className),
      node
    );
  }

  return nodeEnd;
};

// eslint-disable-next-line max-statements
const highlightRegex = (container: HTMLElement, pattern: RegExp, className: string): boolean => {
  const match = pattern.exec(container.textContent || '');
  if (!match) {
    return false;
  }

  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
  const matchStart = match.index;
  const matchEnd = match.index + match[0].length;
  let currentPos = 0;
  let node = walker.nextNode();

  while (node) {
    currentPos = processNodeForRegexMatch({ node, currentPos, matchStart, matchEnd, className });
    node = walker.nextNode();
  }

  return true;
};

const tryHighlightWithFuzzyMatch = (
  textLayer: HTMLElement,
  snippetText: string,
  searchTerms: string[]
): boolean => {
  const chunkLengths = Array.from({ length: 4 }, (_, i) => 20 - i * 5);

  return chunkLengths.some(chunkLength => {
    const startText = textToMatcherRegExp(snippetText.substring(0, chunkLength));
    const endText = textToMatcherRegExp(
      snippetText.substring(
        Math.max(0, snippetText.length - chunkLength - 1),
        snippetText.length - 1
      )
    );

    const fuzzyPattern = `${startText}.{1,200}${endText}`;

    if (highlightRegex(textLayer, new RegExp(fuzzyPattern, 'i'), 'bg-primary-100')) {
      searchTerms.forEach(term => highlightText(textLayer, term, 'searchTerm bg-yellow-200'));
      return true;
    }

    return false;
  });
};

const highlightSnippetInPage = (container: HTMLElement | null, snippet: Snippet): void => {
  if (!container || !snippet.text) {
    return;
  }

  const textLayer = container.querySelector('.textLayer') as HTMLElement;

  if (!textLayer) {
    return;
  }

  const searchTerms = extractSearchTerms(snippet.text);
  const contextPattern = textToMatcherRegExp(snippet.text);

  if (highlightRegex(textLayer, new RegExp(contextPattern, 'i'), 'bg-primary-100')) {
    searchTerms.forEach(term => highlightText(textLayer, term, 'searchTerm bg-yellow-200'));
  } else if (searchTerms.length > 0) {
    tryHighlightWithFuzzyMatch(textLayer, snippet.text, searchTerms);
  }
};

const clearHighlights = (container: HTMLElement | null): void => {
  if (!container) {
    return;
  }

  const marks = container.querySelectorAll('mark');
  marks.forEach(mark => {
    const parent = mark.parentNode;
    if (parent) {
      const children = Array.from(mark.childNodes);
      children.forEach(child => parent.insertBefore(child, mark));
      parent.removeChild(mark);
    }
  });
};

export { clearHighlights, highlightSnippetInPage };
