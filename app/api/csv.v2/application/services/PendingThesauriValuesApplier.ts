import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { sanitizeThesaurusLabel } from '#shared/sanitizationUtils.js';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriValues,
} from '../../domain/CsvImportThesauriValues.js';
import { CsvThesauriPendingChild } from '../../domain/CsvThesauriPendingValues.js';
import { ThesauriRepository } from '../contracts/ThesauriRepository.js';
import { TranslationsRepository } from '../contracts/TranslationsRepository.js';
import { CsvThesauriValuesDiff, ThesauriDiffResult } from './CsvThesauriValuesDiff.js';
import { normalizeCsvThesaurusLabel } from './CsvThesaurusLabelNormalizer.js';

type Deps = {
  thesauriRepo: ThesauriRepository;
  translationsRepo: TranslationsRepository;
};

type ApplyResult = {
  diff: ThesauriDiffResult;
  appliedValues: CsvImportThesauriAppliedValue[];
};

type IndexedRoot = {
  label: string;
  id?: string;
  children: Map<string, { label: string; id?: string }>;
};

const normalizeLabel = (label: string) =>
  normalizeCsvThesaurusLabel(sanitizeThesaurusLabel(label) || '');

const buildThesaurusIndex = (thesaurus: ThesaurusSchema) => {
  const roots = new Map<string, IndexedRoot>();

  (thesaurus.values || []).forEach(root => {
    if (!root?.label) {
      return;
    }
    const normalizedRoot = normalizeLabel(root.label);
    if (!normalizedRoot) {
      return;
    }
    const children = new Map<string, { label: string; id?: string }>();
    (root.values || []).forEach(child => {
      if (!child?.label) {
        return;
      }
      const normalizedChild = normalizeLabel(child.label);
      if (!normalizedChild) {
        return;
      }
      children.set(normalizedChild, { label: child.label, id: child.id });
    });
    roots.set(normalizedRoot, { label: root.label, id: root.id, children });
  });

  return roots;
};

const collectAppliedValuesFromPending = (
  pendingDoc: CsvImportThesauriValues,
  thesaurus: ThesaurusSchema
): CsvImportThesauriAppliedValue[] => {
  const index = buildThesaurusIndex(thesaurus);
  const appliedValues: CsvImportThesauriAppliedValue[] = [];

  const getNormalized = (child: CsvThesauriPendingChild) =>
    normalizeLabel(child.normalized || child.label || '');

  pendingDoc.entries.forEach(entry => {
    entry.roots.forEach(root => {
      const normalizedRoot = getNormalized(root);
      const indexedRoot = normalizedRoot ? index.get(normalizedRoot) : undefined;
      if (indexedRoot?.id) {
        appliedValues.push({ label: indexedRoot.label, valueId: indexedRoot.id });
      }
      root.children.forEach(child => {
        const normalizedChild = getNormalized(child);
        const indexedChild =
          normalizedChild && indexedRoot ? indexedRoot.children.get(normalizedChild) : undefined;
        if (indexedChild?.id) {
          appliedValues.push({
            label: indexedChild.label,
            parentLabel: indexedRoot?.label,
            valueId: indexedChild.id,
          });
        }
      });
    });
  });

  return appliedValues;
};

class PendingThesauriValuesApplier {
  constructor(private deps: Deps) {}

  async apply(pendingDoc: CsvImportThesauriValues): Promise<ApplyResult> {
    const existingThesaurus = await this.deps.thesauriRepo.getById(pendingDoc.thesaurusId);
    const diff = CsvThesauriValuesDiff.diff(pendingDoc, existingThesaurus);

    let appliedValues: CsvImportThesauriAppliedValue[] = [];
    let updatedThesaurus = existingThesaurus;

    if (diff.valuesToAppend.length) {
      updatedThesaurus = await this.deps.thesauriRepo.appendValues(
        pendingDoc.thesaurusId,
        diff.valuesToAppend
      );
      if (Object.keys(diff.translations).length) {
        await this.deps.translationsRepo.updateEntries(
          pendingDoc.thesaurusId,
          diff.translations,
          existingThesaurus.name
        );
      }
    }

    appliedValues = collectAppliedValuesFromPending(pendingDoc, updatedThesaurus);

    return { diff, appliedValues };
  }
}

export { PendingThesauriValuesApplier };
