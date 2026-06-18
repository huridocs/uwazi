type Node =
  | { t: 'term'; value: string; exact: boolean }
  | { t: 'not'; child: Node }
  | { t: 'and'; left: Node; right: Node }
  | { t: 'or'; left: Node; right: Node };

type Token =
  | { k: 'op'; v: 'AND' | 'OR' | 'NOT' }
  | { k: 'lp' }
  | { k: 'rp' }
  | { k: 'term'; v: string; exact: boolean };

const isWhitespace = (c: string) => c === ' ' || c === '\t' || c === '\n';

const readQuotedTerm = (q: string, i: number, tokens: Token[]): number => {
  const end = q.indexOf('"', i + 1);
  const stop = end === -1 ? q.length : end;
  tokens.push({ k: 'term', v: q.slice(i + 1, stop), exact: true });
  return stop + 1;
};

const readWord = (q: string, i: number, tokens: Token[]): number => {
  let j = i;
  while (j < q.length && !/[\s()"]/.test(q[j] ?? '')) j += 1;
  const raw = q.slice(i, j);
  const up = raw.toUpperCase();
  if (up === 'AND' || up === 'OR' || up === 'NOT') tokens.push({ k: 'op', v: up });
  else if (raw.length > 0) tokens.push({ k: 'term', v: raw, exact: false });
  return j;
};

const advanceToken = (q: string, i: number, tokens: Token[]): number => {
  const c = q[i] ?? '';
  if (isWhitespace(c)) return i + 1;
  if (c === '(') {
    tokens.push({ k: 'lp' });
    return i + 1;
  }
  if (c === ')') {
    tokens.push({ k: 'rp' });
    return i + 1;
  }
  if (c === '"') return readQuotedTerm(q, i, tokens);
  return readWord(q, i, tokens);
};

const tokenize = (q: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < q.length) i = advanceToken(q, i, tokens);
  return tokens;
};

const shouldEndAnd = (p: Token | undefined) => !p || p.k === 'rp' || (p.k === 'op' && p.v === 'OR');
const parse = (tokens: Token[]): Node | null => {
  let pos = 0;
  const peek = () => tokens[pos];
  const eat = () => {
    const token = tokens[pos];
    pos += 1;
    return token;
  };

  /* eslint-disable @typescript-eslint/no-use-before-define -- mutual recursion */
  function parseGrouped(): Node | null {
    eat();
    const inner = parseOr();
    if (peek()?.k === 'rp') eat();
    return inner;
  }

  function parseAtom(): Node | null {
    const p = peek();
    if (!p) return null;
    if (p.k === 'lp') return parseGrouped();
    if (p.k === 'term') {
      eat();
      return { t: 'term', value: p.v, exact: p.exact };
    }
    eat();
    return parseAtom();
  }

  function parseNot(): Node | null {
    const p = peek();
    if (!p) return null;
    if (p.k === 'op' && p.v === 'NOT') {
      eat();
      const child = parseNot();
      if (!child) return null;
      return { t: 'not', child };
    }
    return parseAtom();
  }

  function mergeAnd(left: Node): Node {
    const p = peek();
    if (shouldEndAnd(p)) return left;
    if (p?.k === 'op' && p.v === 'AND') eat();
    const right = parseNot();
    return right ? { t: 'and', left, right } : left;
  }

  function parseAnd(): Node | null {
    let left = parseNot();
    if (!left) return null;
    while (pos < tokens.length) {
      const next = mergeAnd(left);
      if (next === left) break;
      left = next;
    }
    return left;
  }

  function parseOr(): Node | null {
    let left = parseAnd();
    if (!left) return null;
    while (peek()?.k === 'op' && (peek() as Token & { k: 'op' }).v === 'OR') {
      eat();
      const right = parseAnd();
      if (!right) break;
      left = { t: 'or', left, right };
    }
    return left;
  }
  /* eslint-enable @typescript-eslint/no-use-before-define */

  return parseOr();
};

const termMatches = (value: string, exact: boolean, text: string): boolean => {
  const t = text.toLowerCase();
  const v = value.toLowerCase();
  if (v.length === 0) return true;
  if (exact) return t.includes(v);
  if (v.includes('*') || v.includes('?')) {
    const pattern = v
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    try {
      return new RegExp(`\\b${pattern}\\b`, 'i').test(t);
    } catch {
      return t.includes(v);
    }
  }
  return t.includes(v);
};

const evaluate = (node: Node, text: string): boolean => {
  switch (node.t) {
    case 'term':
      return termMatches(node.value, node.exact, text);
    case 'not':
      return !evaluate(node.child, text);
    case 'and':
      return evaluate(node.left, text) && evaluate(node.right, text);
    case 'or':
      return evaluate(node.left, text) || evaluate(node.right, text);
    default:
      return false;
  }
};

const buildMatcher = (query: string): ((text: string) => boolean) | null => {
  const q = query.trim();
  if (!q) return null;
  const ast = parse(tokenize(q));
  if (!ast) return null;
  return (text: string) => evaluate(ast, text);
};

export { buildMatcher };
