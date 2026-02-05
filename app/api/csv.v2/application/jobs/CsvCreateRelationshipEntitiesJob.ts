import { TransactionManager } from 'api/core/application/contracts/TransactionManager';
import { AbstractUseCase } from 'api/core/libs/UseCase';
import { JobsDispatcher } from 'api/core/libs/queue/application/contracts/JobsDispatcher';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { MultiLanguageEntityDataSource } from 'api/entities.v2/contracts/MultiLanguageEntitiesDataSource';
import { CsvImportEntitiesJobHandler } from '../../infrastructure/jobHandlers/CsvImportEntitiesJobHandler';
import {
  CsvImport,
  CsvImportDomain,
  CsvImportStatus,
  CsvImportStats,
} from '../../domain/CsvImport';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportRelationshipValuesDataSource } from '../contracts/CsvImportRelationshipValuesDataSource';
import { CsvImportRelationshipPendingValuesDataSource } from '../contracts/CsvImportRelationshipPendingValuesDataSource';
import { Callbacks as BaseCallbacks } from './types/UseCaseCallbacks';
import { CsvImportRelationshipValues } from '../../domain/CsvImportRelationshipValues';
import {
  buildRelationshipAppliedValues,
  createMissingEntitiesForTitles,
} from '../services/CsvPreflightRelationshipsService';

type RelationshipsProgress = {
  importId: string;
  processedTemplates: number;
  totalTemplates: number;
  createdEntities: number;
};

type Callbacks = BaseCallbacks & {
  onProgress: (info: RelationshipsProgress) => void;
};

type Input = {
  importId: string;
  tenantName: string;
  userId: string;
  callbacks: Callbacks;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  entitiesDS: MultiLanguageEntityDataSource;
  relationshipValuesDS: CsvImportRelationshipValuesDataSource;
  relationshipPendingValuesDS: CsvImportRelationshipPendingValuesDataSource;
  entityCreator: (params: { title: string; templateId: string }) => Promise<void>;
  transactionManager: TransactionManager;
  jobsDispatcher: JobsDispatcher;
};

const RELATIONSHIP_TITLES_CHUNK_SIZE = 250;

class CsvCreateRelationshipEntitiesJob extends AbstractUseCase<Input, void, Deps> {
  private async setStatus(importId: string, status: CsvImportStatus) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(csvImport, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
  }

  private async persistFailure(importId: string, error: Error) {
    const csvImportRes = await this.deps.csvImportsDS.getById(importId);
    if (csvImportRes.isError()) {
      return;
    }

    const csvImport = csvImportRes.getData();
    await this.transactionManager.run(async () => {
      const withFailure = CsvImportDomain.withFailure(csvImport, {
        message: error.message,
        retryable: !(error instanceof NonRetryableJobError),
        at: Date.now(),
        stage: 'preflight:relationships:create',
      });
      const withStatus = CsvImportDomain.withStatus(
        withFailure,
        error instanceof NonRetryableJobError ? CsvImportStatus.Failed : CsvImportStatus.Retrying
      );
      await this.deps.csvImportsDS.update(withStatus);
    });
  }

  private async loadContext(importId: string) {
    const csvImport = (await this.deps.csvImportsDS.getById(importId)).getDataOrThrow();
    const pendingDocs = await this.deps.relationshipPendingValuesDS.getByImport(importId);

    const titlesByTemplate = new Map<string, Set<string>>();
    pendingDocs.forEach(doc => {
      if (!doc.titles.length) {
        return;
      }
      const set = titlesByTemplate.get(doc.templateId) || new Set<string>();
      doc.titles.forEach(title => set.add(title));
      titlesByTemplate.set(doc.templateId, set);
    });

    return {
      csvImport,
      titlesByTemplate,
      totalTemplates: titlesByTemplate.size,
    };
  }

  private async finalizeSuccess(params: {
    csvImport: CsvImport;
    relationshipDocs: CsvImportRelationshipValues[];
    observedTitles: number;
    createdEntities: number;
    importId: string;
    tenantName: string;
    userId: string;
  }) {
    const {
      csvImport,
      relationshipDocs,
      observedTitles,
      createdEntities,
      importId,
      tenantName,
      userId,
    } = params;
    await this.transactionManager.run(async () => {
      const cleared = CsvImportDomain.clearFailure(csvImport);
      const withStatus = CsvImportDomain.withStatus(
        cleared,
        CsvImportStatus.PreflightRelationshipsCreateDone
      );
      const updatedStats: CsvImportStats = {
        ...(withStatus.stats || {}),
        relationshipValuesObserved: observedTitles,
        relationshipValuesCreated: createdEntities,
      };
      await this.deps.csvImportsDS.update(withStatus.withStats(updatedStats));
      await this.deps.relationshipValuesDS.replaceValues(importId, relationshipDocs);
      await this.deps.jobsDispatcher.dispatch(CsvImportEntitiesJobHandler, {
        tenantName,
        userId,
        importId,
      });
    });
  }

  private async runCreation(params: {
    importId: string;
    titlesByTemplate: Map<string, Set<string>>;
    totalTemplates: number;
    callbacks: Callbacks;
  }) {
    const { titlesByTemplate, totalTemplates, callbacks, importId } = params;
    const observedTitles = CsvCreateRelationshipEntitiesJob.countObservedTitles(titlesByTemplate);
    if (!titlesByTemplate.size) {
      return {
        createdEntities: 0,
        relationshipDocs: [] as CsvImportRelationshipValues[],
        observedTitles,
      };
    }

    const createdEntities = await createMissingEntitiesForTitles({
      entitiesDS: this.deps.entitiesDS,
      titlesByTemplate,
      chunkSize: RELATIONSHIP_TITLES_CHUNK_SIZE,
      createEntity: this.deps.entityCreator,
    });
    const relationshipDocs = await buildRelationshipAppliedValues({
      entitiesDS: this.deps.entitiesDS,
      importId,
      titlesByTemplate,
      chunkSize: RELATIONSHIP_TITLES_CHUNK_SIZE,
    });
    callbacks.onProgress({
      importId,
      processedTemplates: totalTemplates,
      totalTemplates,
      createdEntities,
    });

    return { createdEntities, relationshipDocs, observedTitles };
  }

  async execute(input: Input): Promise<void> {
    const { importId, callbacks } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightRelationshipsCreate);

    try {
      await this.runApplyFlow(input);
      callbacks.onSuccess({ importId });
    } catch (error) {
      await this.persistFailure(importId, error as Error);
      callbacks.onError({ importId, error: error as Error });
      throw error;
    }
  }

  private async runApplyFlow(input: Input) {
    const { importId, tenantName, userId, callbacks } = input;
    const { csvImport, titlesByTemplate, totalTemplates } = await this.loadContext(importId);
    const creation = await this.runCreation({
      importId,
      titlesByTemplate,
      totalTemplates,
      callbacks,
    });
    await this.finalizeSuccess({
      csvImport,
      relationshipDocs: creation.relationshipDocs,
      observedTitles: creation.observedTitles,
      createdEntities: creation.createdEntities,
      importId,
      tenantName,
      userId,
    });
  }

  private static countObservedTitles(titlesByTemplate: Map<string, Set<string>>) {
    let observed = 0;
    titlesByTemplate.forEach(titles => {
      observed += titles.size;
    });
    return observed;
  }
}

export { CsvCreateRelationshipEntitiesJob };
export type { RelationshipsProgress };
