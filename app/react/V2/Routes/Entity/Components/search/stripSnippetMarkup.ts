import sanitizeHtml from 'sanitize-html';

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: '\u00A0',
};

const HIGHLIGHT = /<b\b[^>]*>([\s\S]*?)<\/b\s*>/gi;
const OPEN_HIGHLIGHT = /<b\b[^>]*>([\s\S]*)$/i;
const MARK_TOKEN = /%%H(\d+)%%/g;
const BLOCK_BREAK = /<br\b[^>]*\/?>|<\/(?:p|div|li|tr|blockquote|h[1-6])\s*>/gi;
const ENTITY = /&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]+);/g;
const COMMENT_CUT = /^([^<]{0,40})-->/u;
const TAG_NAME_CUT = /^\/?[A-Za-z][A-Za-z0-9:-]{0,30}>/u;
const ATTRIBUTE_CUT = /=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>]*)$/u;
const ARROW = /^\s*\S{1,2}\s+$/u;
const OPEN_COMMENT = /<!--[^>]*$/u;
const SLASH_GT = /^\/+>/u;

const markToken = (index: number) => `%%H${index}%%`;

const decodeCodePoint = (body: string): string | undefined => {
  const hex = body[1] === 'x' || body[1] === 'X';
  const digits = body.slice(hex ? 2 : 1);
  const code = hex ? Number.parseInt(digits, 16) : Number.parseInt(digits, 10);
  if (!Number.isInteger(code) || code < 0 || code > 0x10ffff) return undefined;
  return String.fromCodePoint(code);
};

const decodeEntities = (value: string) =>
  value.replace(ENTITY, (entity, body: string) => {
    if (body.startsWith('#')) return decodeCodePoint(body) ?? entity;
    return NAMED_ENTITIES[body.toLowerCase()] ?? entity;
  });

const protectHighlights = (html: string) => {
  const marks: string[] = [];
  const take = (inner: string) => {
    const token = markToken(marks.length);
    marks.push(inner);
    return token;
  };
  const paired = html.replace(HIGHLIGHT, (_match, inner: string) => take(inner));
  const text = paired.replace(OPEN_HIGHLIGHT, (_match, inner: string) => take(inner));
  return { text, marks };
};

const commentCut = (value: string): string | undefined => {
  const match = COMMENT_CUT.exec(value);
  if (!match) return undefined;
  const after = value.slice(match[0].length);
  const arrow = ARROW.test(match[1]) && /^\s/u.test(after);
  if (arrow) return undefined;
  return after.trimStart();
};

const tagNameCut = (value: string): string | undefined => {
  const match = TAG_NAME_CUT.exec(value);
  if (!match) return undefined;
  return value.slice(match[0].length).trimStart();
};

const attributeCut = (value: string): string | undefined => {
  const end = value.indexOf('>');
  if (end < 0) return undefined;
  if (!ATTRIBUTE_CUT.test(value.slice(0, end))) return undefined;
  return value.slice(end + 1).trimStart();
};

const closingCut = (value: string): string | undefined => {
  const slash = SLASH_GT.exec(value);
  if (slash) return value.slice(slash[0].length).trimStart();
  if (!value.startsWith('>')) return undefined;
  return value.slice(1).trimStart();
};

const stripLeadingOnce = (value: string) =>
  commentCut(value) ?? tagNameCut(value) ?? attributeCut(value) ?? closingCut(value) ?? value;

const stripLeadingTagRemnant = (value: string) => {
  let rest = value;
  for (let pass = 0; pass < 3; pass += 1) {
    const next = stripLeadingOnce(rest);
    if (next === rest) return rest;
    rest = next;
  }
  return rest;
};

const stripPlain = (value: string) => {
  const decoded = decodeEntities(value).replace(BLOCK_BREAK, ' ');
  const withoutLead = stripLeadingTagRemnant(decoded).replace(OPEN_COMMENT, '');
  const sanitized = sanitizeHtml(withoutLead, { allowedTags: [], allowedAttributes: {} });
  return decodeEntities(sanitized)
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

const stripSnippetMarkup = (html: string) => {
  if (!html) return '';
  const { text, marks } = protectHighlights(html);
  const cleanedMarks = marks.map(mark => stripPlain(mark));
  return stripPlain(text).replace(MARK_TOKEN, (_match, index: string) => {
    const inner = cleanedMarks[Number(index)] ?? '';
    return inner ? `<b>${inner}</b>` : '';
  });
};

export { stripSnippetMarkup };
