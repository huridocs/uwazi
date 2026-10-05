import type { Finding } from './types.js';

const I18N_IMPORT_RE = /from\s+['"][^'"]*I18N[^'"]*['"]/;
const I18N_NAMED_IMPORT_RE =
  /import\s+\{([^}]*)\}\s+from\s+['"](#app\/I18N(?:\/index\.js)?)['"]\s*;?/;

const jsStringLiteral = (value: string): string => {
  if (!value.includes("'")) {
    return `'${value}'`;
  }
  if (!value.includes('"')) {
    return `"${value}"`;
  }
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
};

const tCall = (key: string): string => `t('System', ${jsStringLiteral(key)}, null, false)`;

type Replacement = {
  start: number;
  end: number;
  value: string;
  finding: Finding;
};

const replacementFor = (finding: Finding): string | undefined => {
  if (!finding.fixable || finding.loc === undefined) {
    return undefined;
  }
  if (finding.kind === 'untranslated-attribute') {
    return `{${tCall(finding.key)}}`;
  }
  if (finding.kind === 'untranslated-notify') {
    return tCall(finding.key);
  }
  return undefined;
};

const neededImports = (applied: Finding[]): { t: boolean; Translate: boolean } => ({
  t: applied.some(
    finding => finding.kind === 'untranslated-attribute' || finding.kind === 'untranslated-notify'
  ),
  Translate: applied.some(finding => finding.kind === 'unwrapped-jsx-text'),
});

const mergeSpecifierList = (existing: string, add: string[]): string => {
  const names = existing
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  add.forEach(name => {
    if (!names.includes(name)) {
      names.push(name);
    }
  });
  const ORDER = ['t', 'Translate'];
  names.sort((left, right) => {
    const leftOrder = ORDER.indexOf(left);
    const rightOrder = ORDER.indexOf(right);
    if (leftOrder !== -1 || rightOrder !== -1) {
      return (
        (leftOrder === -1 ? ORDER.length : leftOrder) -
        (rightOrder === -1 ? ORDER.length : rightOrder)
      );
    }
    return left.localeCompare(right);
  });
  return names.join(', ');
};

const insertImportLine = (source: string, importLine: string): string => {
  const lastImport = [...source.matchAll(/^import[\s\S]*?;\n/gm)].pop();
  if (lastImport && lastImport.index !== undefined) {
    const insertAt = lastImport.index + lastImport[0].length;
    return `${source.slice(0, insertAt)}${importLine}${source.slice(insertAt)}`;
  }
  return `${importLine}${source}`;
};

const ensureI18nImport = (source: string, needs: { t: boolean; Translate: boolean }): string => {
  const add = [...(needs.t ? ['t'] : []), ...(needs.Translate ? ['Translate'] : [])];
  if (!add.length) {
    return source;
  }
  const named = source.match(I18N_NAMED_IMPORT_RE);
  if (named) {
    return source.replace(
      named[0],
      `import { ${mergeSpecifierList(named[1], add)} } from '${named[2]}';`
    );
  }
  if (
    I18N_IMPORT_RE.test(source) &&
    needs.t &&
    /[^a-zA-Z]t[^a-zA-Z]/.test(source) &&
    !needs.Translate
  ) {
    return source;
  }
  return insertImportLine(source, `import { ${add.join(', ')} } from '#app/I18N/index.js';\n`);
};

const jsxTextReplacement = (source: string, finding: Finding): Replacement | undefined => {
  if (!finding.loc) {
    return undefined;
  }
  const slice = source.slice(finding.loc.start, finding.loc.end);
  const offset = slice.indexOf(finding.text);
  if (offset === -1) {
    return undefined;
  }
  return {
    start: finding.loc.start + offset,
    end: finding.loc.start + offset + finding.text.length,
    value: `<Translate>${finding.text}</Translate>`,
    finding,
  };
};

const queueFinding = (
  source: string,
  finding: Finding
): { replacement?: Replacement; leftover?: Finding } => {
  if (finding.kind === 'unwrapped-jsx-text' && finding.fixable && finding.loc) {
    const replacement = jsxTextReplacement(source, finding);
    return replacement ? { replacement } : { leftover: finding };
  }
  const value = replacementFor(finding);
  if (!value || finding.loc === undefined) {
    return { leftover: finding };
  }
  return {
    replacement: { start: finding.loc.start, end: finding.loc.end, value, finding },
  };
};

const applySourceFixes = (
  source: string,
  findings: Finding[]
): { source: string; applied: Finding[]; leftover: Finding[] } => {
  const applied: Finding[] = [];
  const leftover: Finding[] = [];
  const replacements: Replacement[] = [];

  findings.forEach(finding => {
    const queued = queueFinding(source, finding);
    if (queued.leftover) {
      leftover.push(queued.leftover);
      return;
    }
    if (queued.replacement) {
      replacements.push(queued.replacement);
      applied.push(finding);
    }
  });

  replacements.sort((left, right) => right.start - left.start);
  let next = source;
  replacements.forEach(replacement => {
    next = `${next.slice(0, replacement.start)}${replacement.value}${next.slice(replacement.end)}`;
  });

  return { source: ensureI18nImport(next, neededImports(applied)), applied, leftover };
};

export { applySourceFixes, ensureI18nImport, jsStringLiteral };
