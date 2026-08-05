import type { DatavizSource } from '#V2/Dataviz/types/definition.js';

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const defaultAlias = (templateName: string, index: number) => {
  const base = slugify(templateName) || `source_${index + 1}`;
  return index === 0 ? base : `${base}_${index + 1}`;
};

const ensureUniqueAlias = (alias: string, usedAliases: Set<string>, index: number) => {
  if (!usedAliases.has(alias)) {
    return alias;
  }

  let candidate = `${alias}_${index + 1}`;
  let suffix = 2;
  while (usedAliases.has(candidate)) {
    candidate = `${alias}_${suffix}`;
    suffix += 1;
  }
  return candidate;
};

export const ensureSourceAliases = (
  sources: DatavizSource[],
  templateNameById: Map<string, string>
): DatavizSource[] => {
  if (sources.length <= 1) {
    return sources;
  }

  const usedAliases = new Set<string>();

  return sources.map((source, index) => {
    const templateName = templateNameById.get(source.templateId) ?? `source_${index + 1}`;
    const requestedAlias = source.alias?.trim() || defaultAlias(templateName, index);
    const alias = ensureUniqueAlias(requestedAlias, usedAliases, index);
    usedAliases.add(alias);
    return { ...source, alias };
  });
};

export { slugify, defaultAlias };
