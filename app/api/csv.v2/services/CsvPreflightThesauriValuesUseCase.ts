import { AbstractUseCase } from 'api/core/libs/UseCase';
import { TemplatesDataSource } from 'api/core/application/contracts/TemplatesDataSource';
import { SettingsDataSource } from 'api/core/application/contracts/SettingsDataSource';
import { CsvImportsDataSource } from '../contracts/CsvImportsDataSource';
import { CsvImportStatus } from '../model/CsvImport';
import { CsvHeaderAnalyzer } from '../application/CsvHeaderAnalyzer';
import { CsvImportRowsDataSource } from '../contracts/CsvImportRowsDataSource';

type ThesauriWritePort = {
  appendRootLabelsIfMissing(thesaurusId: string, labels: string[]): Promise<void>;
  appendNestedLabelsIfMissing(
    thesaurusId: string,
    entries: Array<{ parent: string; child?: string }>
  ): Promise<void>;
};

type Input = {
  importId: string;
  sessionId?: string;
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

type Callbacks = {
  onStart: (info: { importId: string; sessionId?: string }) => void;
  onSuccess: (info: { importId: string; sessionId?: string }) => void;
  onError: (info: { importId: string; error: Error; sessionId?: string }) => void;
};

export class CsvPreflightThesauriValuesUseCase extends AbstractUseCase<Input, Output, Deps> {
  private async setStatus(importId: string, status: CsvImportStatus) {
    const existing = await this.deps.csvImportsDS.getById(importId);
    if (!existing) {
      throw new Error(`CSV import not found: ${importId}`);
    }
    await this.transactionManager.run(async () => {
      const updated = { ...existing, status, updatedAt: Date.now() };
      await this.deps.csvImportsDS.update(updated);
    });
  }

  // eslint-disable-next-line max-statements
  protected async executeAsync(input: Input, callbacks: Callbacks): Promise<Output> {
    const { importId, sessionId } = input;

    const csvImportAtStart = await this.deps.csvImportsDS.getById(importId);
    if (!csvImportAtStart) {
      throw new Error(`CSV import not found: ${importId}`);
    }
    if (!csvImportAtStart.storage || !csvImportAtStart.storage.path) {
      throw new Error(`CSV import storage path not found for import ${importId}`);
    }
    if (!csvImportAtStart.templateId) {
      throw new Error(`CSV import templateId not found for import ${importId}`);
    }

    const stagedRows = await this.deps.rowsDS.getByImport(importId);
    if (!stagedRows.length) {
      throw new Error('No staged rows found for this import');
    }
    const { headers } = stagedRows[0];

    const templateRes = await this.deps.templatesDS.getById(csvImportAtStart.templateId);
    if (templateRes.isError()) {
      throw new Error('template not found!');
    }
    const templateDomain = templateRes.getData();
    const availableLanguages: string[] = await this.deps.settingsDS.getLanguageKeys();
    const defaultLanguage = await this.deps.settingsDS.getDefaultLanguageKey();

    // Analyze headers/languages per header (v2 analyzer)
    // Build minimal template shape for analyzer (name/type/content)
    const minimalTemplate = {
      properties: (templateDomain.properties || []).map(p => ({
        name: p.name,
        type: p.type,
        content: (p as any).content,
      })),
    };
    CsvHeaderAnalyzer.analyze(headers, minimalTemplate as any, availableLanguages, defaultLanguage);

    // Notify start and set status only after essential validations/analyzers succeed
    callbacks.onStart({ importId, sessionId });
    await this.setStatus(importId, CsvImportStatus.PreflightThesauri);

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
      callbacks.onError({ importId, error: e as Error, sessionId });
      throw e;
    }

    // Notify success
    callbacks.onSuccess({ importId, sessionId });

    return { importId, status: CsvImportStatus.PreflightThesauriDone };
  }
}

export {};
