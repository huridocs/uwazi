import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { TranslationsDataSource } from '#api/i18n.v2/contracts/TranslationsDataSource.js';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriValues,
} from '../../domain/CsvImportThesauriValues.js';
import { CsvThesauriValuesDiff, ThesauriDiffResult } from './CsvThesauriValuesDiff.js';
import {
  appendAndPersistThesaurusValues,
  getThesaurusSchemaById,
} from './PendingThesauriThesaurusGateway.js';
import { upsertThesaurusTranslations } from './PendingThesauriTranslationsGateway.js';
import { collectAppliedValuesFromPending } from './PendingThesauriAppliedValuesCollector.js';

type Deps = {
  thesauriDS: ThesauriDataSource;
  translationsDS: TranslationsDataSource;
};

type ApplyResult = {
  diff: ThesauriDiffResult;
  appliedValues: CsvImportThesauriAppliedValue[];
};

class PendingThesauriValuesApplier {
  constructor(private deps: Deps) {}

  async apply(pendingDoc: CsvImportThesauriValues): Promise<ApplyResult> {
    const existingThesaurus = await getThesaurusSchemaById(this.deps.thesauriDS, pendingDoc.thesaurusId);
    const diff = CsvThesauriValuesDiff.diff(pendingDoc, existingThesaurus);

    let appliedValues: CsvImportThesauriAppliedValue[] = [];
    let updatedThesaurus = existingThesaurus;

    if (diff.valuesToAppend.length) {
      updatedThesaurus = await appendAndPersistThesaurusValues(
        this.deps.thesauriDS,
        pendingDoc.thesaurusId,
        diff.valuesToAppend
      );
      if (Object.keys(diff.translations).length) {
        await upsertThesaurusTranslations(
          this.deps.translationsDS,
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
