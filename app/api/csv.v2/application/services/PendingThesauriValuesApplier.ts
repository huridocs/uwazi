import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriValues,
} from '#api/csv.v2/domain/CsvImportThesauriValues.js';
import { ThesauriRepository } from '#api/csv.v2/application/contracts/ThesauriRepository.js';
import { TranslationsRepository } from '#api/csv.v2/application/contracts/TranslationsRepository.js';
import {
  CsvThesauriValuesDiff,
  ThesauriDiffResult,
} from '#api/csv.v2/application/services/CsvThesauriValuesDiff.js';

type Deps = {
  thesauriRepo: ThesauriRepository;
  translationsRepo: TranslationsRepository;
};

type ApplyResult = {
  diff: ThesauriDiffResult;
  appliedValues: CsvImportThesauriAppliedValue[];
};

class PendingThesauriValuesApplier {
  constructor(private deps: Deps) {}

  private static extractAppliedValues(
    thesaurus: ThesaurusSchema,
    descriptors: ThesauriDiffResult['createdDescriptors']
  ): CsvImportThesauriAppliedValue[] {
    const roots = new Map<string, any>();
    (thesaurus.values || []).forEach(root => {
      if (root?.label) {
        roots.set(root.label, root);
      }
    });

    return descriptors
      .map(descriptor => {
        if (!descriptor.parentLabel) {
          const root = roots.get(descriptor.label);
          if (root?.id) {
            return {
              label: descriptor.label,
              valueId: root.id,
            };
          }
          return undefined;
        }
        const parent = roots.get(descriptor.parentLabel);
        const child = parent?.values?.find((value: any) => value.label === descriptor.label);
        if (child?.id) {
          return {
            label: descriptor.label,
            parentLabel: descriptor.parentLabel,
            valueId: child.id,
          };
        }
        return undefined;
      })
      .filter(Boolean) as CsvImportThesauriAppliedValue[];
  }

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
        await this.deps.translationsRepo.updateEntries(pendingDoc.thesaurusId, diff.translations);
      }
      appliedValues = PendingThesauriValuesApplier.extractAppliedValues(
        updatedThesaurus,
        diff.createdDescriptors
      );
    }

    return { diff, appliedValues };
  }
}

export { PendingThesauriValuesApplier };
