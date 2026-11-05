import { Pair } from './plans.js';

const SEARCH_CONTEXT = /q=|filters:|\{list\}|\/library/;
const PLACEHOLDER = (index: number) => `\u0000uwazi-rename-${index}\u0000`;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const decodeOnce = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const decodeTwice = (value: string): string => {
  const once = decodeOnce(value);
  if (once === value) return once;
  return decodeOnce(once);
};

const replaceSearchKeys = (value: string, from: string, to: string): string => {
  const token = escapeRegExp(from);
  return value
    .replace(new RegExp(`\\(${token}:`, 'g'), `(${to}:`)
    .replace(new RegExp(`,${token}:`, 'g'), `,${to}:`)
    .replace(new RegExp(`sort:${token}(?![A-Za-z0-9_])`, 'g'), `sort:${to}`);
};

const replaceAttributes = (value: string, from: string, to: string): string => {
  const token = escapeRegExp(from);
  return value
    .replace(new RegExp(`property=(["'])${token}\\1`, 'g'), `property=$1${to}$1`)
    .replace(new RegExp(`filterProperty=(["'])${token}\\1`, 'g'), `filterProperty=$1${to}$1`);
};

const replacePair = (
  value: string,
  pair: { from: string; to: string },
  search: boolean
): string => {
  const withAttributes = replaceAttributes(value, pair.from, pair.to);
  if (!search) return withAttributes;
  return replaceSearchKeys(withAttributes, pair.from, pair.to);
};

const rewriteText = (value: string, pairs: Pair[]): string => {
  const decoded = decodeTwice(value);
  const search = SEARCH_CONTEXT.test(decoded);
  const sorted = [...pairs].sort((a, b) => b.from.length - a.from.length);
  const marked = sorted.reduce(
    (current, pair, index) =>
      replacePair(current, { from: pair.from, to: PLACEHOLDER(index) }, search),
    decoded
  );
  const replaced = sorted.reduce(
    (current, pair, index) => current.replaceAll(PLACEHOLDER(index), pair.to),
    marked
  );
  if (replaced === decoded) return value;
  return replaced;
};

export { rewriteText };
