import type { LibraryPermissionPick } from '#shared/types/librarySearch.js';

type LibraryFiltersState = Record<string, string[]>;
type Cursor = { inner: string; i: number };

const SIMPLE_VALUE = /^[A-Za-z0-9._-]+$/;
const IDENT = /[A-Za-z0-9._-]/;

const serializeFilterValue = (value: string): string => {
  if (SIMPLE_VALUE.test(value)) {
    return value;
  }
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
};

const unwrap = (raw: string): string | null => {
  const input = raw.trim();
  if (!input) {
    return '';
  }
  if (input[0] !== '(' || input[input.length - 1] !== ')') {
    return null;
  }
  return input.slice(1, -1);
};

const readIdent = (cursor: Cursor): string => {
  const start = cursor.i;
  while (cursor.i < cursor.inner.length && IDENT.test(cursor.inner[cursor.i]!)) {
    cursor.i += 1;
  }
  return cursor.inner.slice(start, cursor.i);
};

const appendChar = (cursor: Cursor, out: string): string => {
  const pair = cursor.inner.slice(cursor.i, cursor.i + 2);
  if (pair === "\\'" || pair === '\\\\') {
    cursor.i += 2;
    return out + (pair === "\\'" ? "'" : '\\');
  }
  const next = out + cursor.inner[cursor.i];
  cursor.i += 1;
  return next;
};

const readQuoted = (cursor: Cursor): string | null => {
  cursor.i += 1;
  let out = '';
  while (cursor.i < cursor.inner.length && cursor.inner[cursor.i] !== "'") {
    out = appendChar(cursor, out);
  }
  if (cursor.inner[cursor.i] !== "'") {
    return null;
  }
  cursor.i += 1;
  return out;
};

const readValue = (cursor: Cursor): string | null => {
  if (cursor.inner[cursor.i] === "'") {
    return readQuoted(cursor);
  }
  const ident = readIdent(cursor);
  return ident || null;
};

const pushValue = (cursor: Cursor, values: string[]): boolean | null => {
  const value = readValue(cursor);
  if (value === null) {
    return null;
  }
  values.push(value);
  if (cursor.inner[cursor.i] !== ',') {
    return false;
  }
  cursor.i += 1;
  return true;
};

const readValues = (cursor: Cursor): string[] | null => {
  const values: string[] = [];
  if (cursor.inner[cursor.i] === ')') {
    return values;
  }
  while (cursor.i < cursor.inner.length) {
    const step = pushValue(cursor, values);
    if (step === null) {
      return null;
    }
    if (!step) {
      break;
    }
  }
  return values;
};

const openList = (cursor: Cursor, key: string): boolean => {
  if (!key || cursor.inner[cursor.i] !== ':') {
    return false;
  }
  cursor.i += 1;
  if (cursor.inner[cursor.i] !== '(') {
    return false;
  }
  cursor.i += 1;
  return true;
};

const closeList = (cursor: Cursor, values: string[] | null): values is string[] => {
  if (!values || cursor.inner[cursor.i] !== ')') {
    return false;
  }
  cursor.i += 1;
  if (cursor.inner[cursor.i] === ',') {
    cursor.i += 1;
  }
  return true;
};

const readEntry = (cursor: Cursor): { key: string; values: string[] } | null => {
  const key = readIdent(cursor);
  if (!openList(cursor, key)) {
    return null;
  }
  const values = readValues(cursor);
  if (!closeList(cursor, values)) {
    return null;
  }
  return { key, values };
};

const fillEntries = (cursor: Cursor, result: LibraryFiltersState): boolean => {
  while (cursor.i < cursor.inner.length) {
    const entry = readEntry(cursor);
    if (!entry) {
      return false;
    }
    result[entry.key] = entry.values;
  }
  return true;
};

const parseCompactFilters = (raw: string): LibraryFiltersState | null => {
  const inner = unwrap(raw);
  if (inner === null) {
    return null;
  }
  if (!inner.trim()) {
    return {};
  }
  const result: LibraryFiltersState = {};
  const filled = fillEntries({ inner, i: 0 }, result);
  return filled ? result : null;
};

const serializeCompactFilters = (filters: LibraryFiltersState): string => {
  const parts = Object.entries(filters)
    .filter(([, values]) => values.length > 0)
    .map(([key, values]) => `${key}:(${values.map(serializeFilterValue).join(',')})`);
  return parts.length ? `(${parts.join(',')})` : '';
};

const parsePermissionFilters = (raw: string): LibraryPermissionPick[] | null => {
  const parsed = parseCompactFilters(raw);
  if (!parsed) {
    return null;
  }
  const picks: LibraryPermissionPick[] = [];
  (['read', 'write'] as const).forEach(level => {
    (parsed[level] ?? []).forEach(refId => {
      if (!refId || picks.some(pick => pick.level === level && pick.refId === refId)) {
        return;
      }
      picks.push({ level, refId });
    });
  });
  return picks;
};

const serializePermissionFilters = (picks: LibraryPermissionPick[]): string => {
  const grouped: LibraryFiltersState = {};
  picks.forEach(pick => {
    if ((pick.level !== 'read' && pick.level !== 'write') || !pick.refId) {
      return;
    }
    const values = grouped[pick.level] ?? [];
    if (!values.includes(pick.refId)) {
      values.push(pick.refId);
    }
    grouped[pick.level] = values;
  });
  const ordered: LibraryFiltersState = {};
  if (grouped.read?.length) {
    ordered.read = grouped.read;
  }
  if (grouped.write?.length) {
    ordered.write = grouped.write;
  }
  return serializeCompactFilters(ordered);
};

const advanceIdent = (inner: string, index: number): number => {
  let i = index;
  while (i < inner.length && IDENT.test(inner[i]!)) {
    i += 1;
  }
  return i;
};

const readName = (inner: string, index: number): { name: string; i: number } | null => {
  const i = advanceIdent(inner, index);
  const name = inner.slice(index, i);
  if (!name || (inner[i] && inner[i] !== ',')) {
    return null;
  }
  return { name, i: inner[i] === ',' ? i + 1 : i };
};

const collectNames = (inner: string): string[] | null => {
  const names: string[] = [];
  let i = 0;
  while (i < inner.length) {
    const next = readName(inner, i);
    if (!next) {
      return null;
    }
    names.push(next.name);
    ({ i } = next);
  }
  return names;
};

const parseAndFilters = (raw: string): string[] | null => {
  const inner = unwrap(raw);
  if (inner === null) {
    return null;
  }
  const names = !inner.trim() ? [] : collectNames(inner);
  return names && [...new Set(names)];
};

const serializeAndFilters = (names: string[]): string => {
  const unique = [...new Set(names.filter(Boolean))];
  return unique.length ? `(${unique.join(',')})` : '';
};

export {
  parseAndFilters,
  parseCompactFilters,
  parsePermissionFilters,
  serializeAndFilters,
  serializeCompactFilters,
  serializePermissionFilters,
};
export type { LibraryFiltersState };
