import { ProcessedPDFDBO } from '../../mongodb/files/schemas/filesTypes.js';
import { MongoEntityDAO } from '../../mongodb/entity/MongoEntityDAO.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { EntityIndexMappingDefinition } from './EntityIndexMappingDefinition.js';
import { FullTextElasticDocumentMapper } from './FullTextElasticDocumentMapper.js';

type FullTextIndexerServiceDeps = {
  esClient: TenantAwareESClient;
  entityDAO: MongoEntityDAO;
};

class FullTextIndexerService {
  private alias = EntityIndexMappingDefinition.alias;

  constructor(private deps: FullTextIndexerServiceDeps) {}

  async index(files: ProcessedPDFDBO[], refresh = false): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const sharedIds = [...new Set(files.map(f => f.entity))];
    const entityVariants = await this.deps.entityDAO.getEntityIdsBySharedId(sharedIds);

    const pairs = files.flatMap(file =>
      entityVariants.filter(e => e.sharedId === file.entity).map(e => ({ file, entityId: e._id }))
    );

    const operations = FullTextElasticDocumentMapper.toDocuments(
      pairs,
      this.deps.esClient.tenantId
    );

    if (operations.length === 0) {
      return;
    }

    await this.deps.esClient.bulk({
      alias: this.alias,
      operations,
      routing: this.deps.esClient.tenantId,
      refresh,
    });
  }

  async deleteByFilenames(filenames: string[], refresh = false): Promise<void> {
    if (filenames.length === 0) {
      return;
    }

    await this.deps.esClient.deleteByQuery({
      alias: this.alias,
      routing: this.deps.esClient.tenantId,
      query: {
        bool: {
          filter: [{ terms: { filename: filenames } }, { term: { fullText: 'fullText' } }],
        },
      },
      refresh,
    });
  }
}

export { FullTextIndexerService };
export type { FullTextIndexerServiceDeps };
