import { PostgresDataSource } from '#api/core/infrastructure/postgresql/common/PostgresDataSource.js';
import { PostgresTransactionManager } from '#api/core/infrastructure/postgresql/common/PostgresTransactionManager.js';
import {
  PostgresTemplateMapper,
  TemplateRow,
} from '#api/core/infrastructure/postgresql/template/PostgresTemplateMapper.js';
import { TemplatesDAOFactory } from '#api/core/infrastructure/factories/TemplatesDAOFactory.js';

import { PXExtractor } from '../../domain/PXExtractor.js';
import {
  ExistsInput,
  GetParagraphsIdsInput,
  PXExtractorsDataSource,
} from '../../domain/PXExtractorDataSource.js';
import { PXExtractorsQueryService } from '../../domain/PXExtractorsQueryService.js';
import { PXValidationError } from '../../domain/PXValidationError.js';
import { PXExtractorRow } from './PXExtractorRow.js';
import { PostgresPXExtractorMapper } from './PostgresPXExtractorMapper.js';

type TemplatesDAO = Awaited<ReturnType<typeof TemplatesDAOFactory.default>>;

type Deps = {
  tenantId: string;
  pgTransactionManager: PostgresTransactionManager;
  extractorsQueryService: PXExtractorsQueryService;
  templatesDAO: TemplatesDAO;
};

export class PostgresPXExtractorsDataSource
  extends PostgresDataSource<PXExtractorRow>
  implements PXExtractorsDataSource
{
  private extractorsQueryService: PXExtractorsQueryService;

  private templatesDAO: TemplatesDAO;

  constructor(deps: Deps) {
    super('px_extractors', {
      tenantId: deps.tenantId,
      pgTransactionManager: deps.pgTransactionManager,
    });
    this.extractorsQueryService = deps.extractorsQueryService;
    this.templatesDAO = deps.templatesDAO;
  }

  async create(extractor: PXExtractor): Promise<void> {
    await this.table.insert(PostgresPXExtractorMapper.toRow(extractor));
  }

  async getBySourceTemplate(sourceTemplateId: string): Promise<PXExtractor | undefined> {
    const row = await this.table.where({ sourceTemplateId }).first();
    return row ? this.getById(row._id) : undefined;
  }

  async getById(extractorId: string): Promise<PXExtractor | undefined> {
    const row = await this.table.where({ _id: extractorId }).first();
    if (!row) return undefined;

    const templateIds = [row.sourceTemplateId, row.targetTemplateId];
    const templateRows = (await this.templatesDAO.get(templateIds)) as TemplateRow[];
    const templateMap = new Map(templateRows.map(t => [t._id, t]));

    const sourceTemplate = templateMap.get(row.sourceTemplateId);
    const targetTemplate = templateMap.get(row.targetTemplateId);

    if (!sourceTemplate || !targetTemplate) return undefined;

    return PostgresPXExtractorMapper.toDomain(
      row,
      PostgresTemplateMapper.toDomain(sourceTemplate),
      PostgresTemplateMapper.toDomain(targetTemplate)
    );
  }

  async exists(input: ExistsInput): Promise<boolean> {
    const row = await this.table.where({ sourceTemplateId: input.sourceTemplateId }).first();
    return Boolean(row);
  }

  async delete(extractorId: string): Promise<void> {
    const deletedIds = await this.table.where({ _id: extractorId }).delete();

    if (deletedIds.length === 0) {
      throw new PXValidationError(
        PXValidationError.codes.CANNOT_DELETE_EXTRACTOR_THAT_DOES_NOT_EXIST,
        `Cannot delete an Extractor that does not exist. Id: ${extractorId}`
      );
    }

    await this.table.raw('DELETE FROM px_entities_status WHERE "extractorId" = ?', [extractorId]);
  }

  async getParagraphsIds({
    entitySharedId,
    extractorId,
  }: GetParagraphsIdsInput): Promise<string[]> {
    const paragraphs = await this.extractorsQueryService
      .getEntityParagraphRelationships({
        extractorId,
        id: entitySharedId,
      })
      .all();

    return paragraphs.map(p => p.entitySharedId);
  }
}
