import { AbstractUseCase } from 'api/core/libs/UseCase';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { NonRetryableJobError } from 'api/core/libs/queue/infrastructure/errors';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportDomain, CsvImportStatus } from '../model/CsvImport';
import { CsvHeaderAnalyzer } from '../application/CsvHeaderAnalyzer';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource';
import { Callbacks } from '../types/UseCaseCallbacks';

type ThesauriWritePort = {
  appendRootLabelsIfMissing(thesaurusId: string, labels: string[]): Promise<void>;
  appendNestedLabelsIfMissing(
    thesaurusId: string,
    entries: Array<{ parent: string; child?: string }>
  ): Promise<void>;
};

type Input = {
  importId: string;
  callbacks: Callbacks;
};

type Output = {
  importId: string;
  status: string;
};

type Deps = {
  csvImportsDS: CsvImportsDataSource;
  rowsDS: CsvImportRowsDataSource;
  templatesDS: TemplatesDataSource;
  settingsDS: SettingsDataSource;
  thesauriDS: ThesauriWritePort;
};

export class CsvPreflightThesauriValuesUseCase extends AbstractUseCase<Input, Output, Deps> {
  private async setStatus(importId: string, status: CsvImportStatus) {
    const existing = await this.deps.csvImportsDS.getById(importId);
    if (!existing) {
      throw new Error(`CSV import not found: ${importId}`);
    }
    await this.transactionManager.run(async () => {
      const updated = CsvImportDomain.withStatus(existing, status);
      await this.deps.csvImportsDS.update(updated);
    });
  }

  async markAsFailed(importId: string) {
    await this.setStatus(importId, CsvImportStatus.Failed);
  }

  private async getImport(importId: string) {
    const csvImport = await this.deps.csvImportsDS.getById(importId);
    if (!csvImport) {
      throw new NonRetryableJobError(new Error(`CSV import not found: ${importId}`));
    }
    if (!csvImport.storage?.path) {
      throw new NonRetryableJobError(
        new Error(`CSV import storage path not found for import ${importId}`)
      );
    }
    if (!csvImport.templateId) {
      throw new NonRetryableJobError(
        new Error(`CSV import templateId not found for import ${importId}`)
      );
    }
    return csvImport;
  }

  private async getStagedRows(importId: string) {
    const rows = await this.deps.rowsDS.getByImport(importId);
    if (!rows.length) {
      throw new NonRetryableJobError(new Error(`No staged rows found for import ${importId}`));
    }
    return rows;
  }

  private async getMinimalTemplate(templateId: string) {
    const templateRes = await this.deps.templatesDS.getById(templateId);
    if (templateRes.isError()) {
      throw new NonRetryableJobError(new Error(`template not found! ${templateId}`));
    }
    const templateDomain = templateRes.getData();

    // Build minimal template shape for analyzer (name/type/content)
    const minimalTemplate = {
      properties: (templateDomain.properties || []).map(p => ({
        name: p.name,
        type: p.type,
        content: (p as any).content,
      })),
    };
    return minimalTemplate;
  }

  // eslint-disable-next-line max-statements
  protected async executeAsync(input: Input): Promise<Output> {
    const { importId, callbacks } = input;

    callbacks.onStart({ importId });
    await this.setStatus(importId, CsvImportStatus.PreflightThesauri);

    const csvImport = await this.getImport(importId);
    const stagedRows = await this.getStagedRows(importId);
    const availableLanguages = await this.deps.settingsDS.getLanguageKeys();
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();
    const minimalTemplate = await this.getMinimalTemplate(csvImport.templateId);

    // Analyze headers/languages per header (v2 analyzer)
    const { headers } = stagedRows[0];
    CsvHeaderAnalyzer.analyze(headers, minimalTemplate as any, availableLanguages, defaultLanguage);

    // Create missing thesauri values (full parity: root and nested for select properties; default language column)
    const selectProps = (minimalTemplate.properties || []).filter(
      (p: any) => p.type === 'select' && p.content
    ) as Array<{ name: string; content: string }>;
    const updatesRoot: Array<{ thesaurusId: string; labels: string[] }> = [];
    const updatesNested: Array<{ thesaurusId: string; parent: string; child?: string }>[] = [];
    selectProps.forEach(prop => {
      const defaultHeader = `${prop.name}__${defaultLanguage}`;
      const colIndex = headers.indexOf(defaultHeader);
      if (colIndex === -1) return;
      const entries = stagedRows
        .map(r => r.values[colIndex]?.trim())
        .filter((v): v is string => !!v && v.length > 0)
        .map(label => {
          const parts = label.split('::').map(s => s.trim());
          if (parts.length === 2) return { parent: parts[0], child: parts[1] };
          return { parent: parts[0] };
        });
      const roots = entries.filter(e => !e.child).map(e => e.parent);
      const nesteds = entries.filter(e => e.child) as Array<{ parent: string; child: string }>;
      if (roots.length) {
        updatesRoot.push({ thesaurusId: prop.content.toString(), labels: roots });
      }
      if (nesteds.length) {
        updatesNested.push(
          nesteds.map(n => ({
            thesaurusId: prop.content.toString(),
            parent: n.parent,
            child: n.child,
          }))
        );
      }
    });

    try {
      // Heavy work in a single transaction
      await this.transactionManager.run(async () => {
        // Apply thesauri updates (root and nested)
        for (const u of updatesRoot) {
          // eslint-disable-next-line no-await-in-loop
          await this.deps.thesauriDS.appendRootLabelsIfMissing(u.thesaurusId, u.labels);
        }
        for (const group of updatesNested) {
          const groupedByTh = new Map<string, Array<{ parent: string; child?: string }>>();
          group.forEach(e => {
            const arr = groupedByTh.get(e.thesaurusId) || [];
            arr.push({ parent: e.parent, child: e.child });
            groupedByTh.set(e.thesaurusId, arr);
          });
          for (const [thId, entries] of groupedByTh) {
            // eslint-disable-next-line no-await-in-loop
            await this.deps.thesauriDS.appendNestedLabelsIfMissing(thId, entries);
          }
        }
      });
      // Set status to preflight done (committed) after heavy work
      await this.setStatus(importId, CsvImportStatus.PreflightThesauriDone);
    } catch (e) {
      callbacks.onError({ importId, error: e as Error });
      throw e;
    }

    // Notify success
    callbacks.onSuccess({ importId });

    return { importId, status: CsvImportStatus.PreflightThesauriDone };
  }
}

export {};
