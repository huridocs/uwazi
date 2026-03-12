import { sanitizeThesaurusLabel } from '#shared/sanitizationUtils.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { CsvImportThesauriValues } from '../../domain/CsvImportThesauriValues.js';
import { CsvThesauriPendingChild } from '../../domain/CsvThesauriPendingValues.js';
import { ThesaurusValueInput } from '../contracts/ThesauriRepository.js';
import { normalizeCsvThesaurusLabel } from './CsvThesaurusLabelNormalizer.js';

type AggregatedChild = {
  label: string;
  normalized: string;
  languages: Record<string, string>;
};

type AggregatedRoot = {
  label: string;
  normalized: string;
  languages: Record<string, string>;
  children: Map<string, AggregatedChild>;
};

type ExistingRoot = {
  label: string;
  children: Map<string, string>;
};

type ThesauriDiffResult = {
  valuesToAppend: ThesaurusValueInput[];
  translations: Record<string, Record<string, string>>;
  createdDescriptors: Array<{ label: string; parentLabel?: string }>;
  observedValues: number;
};

type DiffState = {
  valuesToAppend: ThesaurusValueInput[];
  translations: Record<string, Record<string, string>>;
  createdDescriptors: Array<{ label: string; parentLabel?: string }>;
};

const normalizeLabel = (label: string) =>
  normalizeCsvThesaurusLabel(sanitizeThesaurusLabel(label) || '');

const aggregatePendingEntries = (pendingDoc: CsvImportThesauriValues) => {
  const roots = new Map<string, AggregatedRoot>();

  const ensureRoot = (root: CsvThesauriPendingChild): AggregatedRoot => {
    const key = normalizeLabel(root.normalized || root.label) || root.label;
    const existing = roots.get(key);
    if (existing) {
      Object.entries(root.languages).forEach(([lang, value]) => {
        if (!existing.languages[lang]) {
          existing.languages[lang] = value;
        }
      });
      return existing;
    }
    const aggregated: AggregatedRoot = {
      label: root.label,
      normalized: key,
      languages: { ...root.languages },
      children: new Map(),
    };
    roots.set(key, aggregated);
    return aggregated;
  };

  const ensureChild = (parent: AggregatedRoot, child: CsvThesauriPendingChild) => {
    const key = normalizeLabel(child.normalized || child.label) || child.label;
    const existing = parent.children.get(key);
    if (existing) {
      Object.entries(child.languages).forEach(([lang, value]) => {
        if (!existing.languages[lang]) {
          existing.languages[lang] = value;
        }
      });
      return;
    }
    parent.children.set(key, {
      label: child.label,
      normalized: key,
      languages: { ...child.languages },
    });
  };

  pendingDoc.entries.forEach(entry => {
    entry.roots.forEach(root => {
      const aggregatedRoot = ensureRoot(root);
      root.children.forEach(child => ensureChild(aggregatedRoot, child));
    });
  });

  return roots;
};

const buildExistingRootsIndex = (thesaurus: ThesaurusSchema) => {
  const map = new Map<string, ExistingRoot>();
  (thesaurus.values || []).forEach(root => {
    if (!root?.label) {
      return;
    }
    const normalizedRoot = normalizeLabel(root.label);
    if (!normalizedRoot) {
      return;
    }
    const childMap = new Map<string, string>();
    (root.values || []).forEach(child => {
      if (!child?.label) return;
      const normalizedChild = normalizeLabel(child.label);
      if (!normalizedChild) return;
      childMap.set(normalizedChild, child.label);
    });
    map.set(normalizedRoot, { label: root.label, children: childMap });
  });
  return map;
};

const mergeTranslations = (
  targetTranslations: Record<string, Record<string, string>>,
  languages: Record<string, string>,
  label: string
) => {
  let merged = targetTranslations;
  Object.entries(languages).forEach(([lang, value]) => {
    if (!value) {
      return;
    }
    const current = merged[lang] || {};
    merged = {
      ...merged,
      [lang]: {
        ...current,
        [label]: value,
      },
    };
  });
  return merged;
};

const getNewChildren = (root: AggregatedRoot, existingRoot: ExistingRoot) =>
  Array.from(root.children.values()).filter(child => !existingRoot.children.has(child.normalized));

const appendChildDiffs = (
  root: AggregatedRoot,
  children: AggregatedChild[],
  state: DiffState
): DiffState => {
  const { valuesToAppend, createdDescriptors } = state;
  let { translations } = state;

  valuesToAppend.push({
    label: root.label,
    values: children.map(child => ({ label: child.label })),
  });

  for (const child of children) {
    createdDescriptors.push({ label: child.label, parentLabel: root.label });
    translations = mergeTranslations(translations, child.languages, child.label);
  }

  return { ...state, translations };
};

const pushRootChildren = (root: AggregatedRoot, state: DiffState): DiffState => {
  const { valuesToAppend, createdDescriptors } = state;
  let { translations } = state;

  valuesToAppend.push({
    label: root.label,
    values: Array.from(root.children.values()).map(child => ({ label: child.label })),
  });
  for (const child of root.children.values()) {
    translations = mergeTranslations(translations, child.languages, child.label);
    createdDescriptors.push({ label: child.label, parentLabel: root.label });
  }

  return { ...state, translations };
};

const handleNewRoot = (root: AggregatedRoot, state: DiffState): DiffState => {
  let nextState = state;

  if (root.children.size) {
    nextState = pushRootChildren(root, state);
  } else {
    nextState.valuesToAppend.push({ label: root.label });
  }

  const { createdDescriptors } = nextState;
  createdDescriptors.push({ label: root.label });
  const updatedTranslations = mergeTranslations(nextState.translations, root.languages, root.label);

  return { ...nextState, translations: updatedTranslations };
};

const handleExistingRoot = (
  root: AggregatedRoot,
  existingRoot: ExistingRoot,
  state: DiffState
): DiffState => {
  const newChildren = getNewChildren(root, existingRoot);
  if (!newChildren.length) {
    return state;
  }
  return appendChildDiffs(root, newChildren, state);
};

const createDiffState = (): DiffState => ({
  valuesToAppend: [],
  translations: {},
  createdDescriptors: [],
});

const diff = (
  pendingDoc: CsvImportThesauriValues,
  thesaurus: ThesaurusSchema
): ThesauriDiffResult => {
  const aggregatedRoots = aggregatePendingEntries(pendingDoc);
  const existingRoots = buildExistingRootsIndex(thesaurus);
  let state = createDiffState();

  for (const root of aggregatedRoots.values()) {
    const existingRoot = existingRoots.get(root.normalized);

    state = existingRoot
      ? handleExistingRoot(root, existingRoot, state)
      : handleNewRoot(root, state);
  }

  const observedValues =
    aggregatedRoots.size +
    Array.from(aggregatedRoots.values()).reduce((acc, root) => acc + root.children.size, 0);

  return {
    valuesToAppend: state.valuesToAppend,
    translations: state.translations,
    createdDescriptors: state.createdDescriptors,
    observedValues,
  };
};

export const CsvThesauriValuesDiff = {
  diff,
};

export type { ThesauriDiffResult };
