import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { ThesauriService } from '#api/core/application/ThesauriService.js';
import {
  CsvImportThesauriAppliedValue,
  CsvImportThesauriValues,
} from '../../domain/CsvImportThesauriValues.js';
import { CsvThesauriValuesDiff, ThesauriDiffResult } from './CsvThesauriValuesDiff.js';
import {
  appendValuesToThesaurus,
  getThesaurusById,
  getThesaurusSchemaById,
  toSchema,
} from './PendingThesauriThesaurusGateway.js';
import { collectAppliedValuesFromPending } from './PendingThesauriAppliedValuesCollector.js';

type Deps = {
  thesauriDS: ThesauriDataSource;
  thesauriService: ThesauriService;
};

type ApplyResult = {
  diff: ThesauriDiffResult;
  appliedValues: CsvImportThesauriAppliedValue[];
};

/**
 * Ambient-TX service: callers (Job / UseCase) must open transactionManager.run()
 * before apply() when values are appended (ThesauriService → TranslationsService).
 * Translation value updates are orchestrated by the Job via UpdateEntriesByContext UC.
 */
class PendingThesauriValuesApplier {
  constructor(private deps: Deps) {}

  // eslint-disable-next-line max-statements
  async apply(
    pendingDoc: CsvImportThesauriValues,
    executionContext: { tenantName: string; userId: string }
  ): Promise<ApplyResult> {
    const existingThesaurus = await getThesaurusSchemaById(
      this.deps.thesauriDS,
      pendingDoc.thesaurusId
    );
    const diff = CsvThesauriValuesDiff.diff(pendingDoc, existingThesaurus);

    let appliedValues: CsvImportThesauriAppliedValue[] = [];
    let updatedThesaurus = existingThesaurus;

    if (diff.valuesToAppend.length) {
      const currentThesaurus = await getThesaurusById(this.deps.thesauriDS, pendingDoc.thesaurusId);
      const updatedThesaurusDomain = appendValuesToThesaurus(currentThesaurus, diff.valuesToAppend);

      await this.deps.thesauriService.update(updatedThesaurusDomain, {
        tenantName: executionContext.tenantName,
        actorId: executionContext.userId,
      });

      updatedThesaurus = toSchema(updatedThesaurusDomain);
    }

    appliedValues = collectAppliedValuesFromPending(pendingDoc, updatedThesaurus);

    return { diff, appliedValues };
  }
}

export { PendingThesauriValuesApplier };
