import { ProcessedPDFDBO } from '../../mongodb/files/schemas/filesTypes.js';
import { TenantAwareESClient } from '../TenantAwareESClient.js';
import { EntityIndexMappingDefinition } from './EntityIndexMappingDefinition.js';
import { FullTextElasticDocumentMapper } from './FullTextElasticDocumentMapper.js';

type FullTextESWriterDeps = {
  esClient: TenantAwareESClient;
};

class FullTextESWriter {
  private alias = EntityIndexMappingDefinition.alias;

  constructor(private deps: FullTextESWriterDeps) {}

  async index(files: ProcessedPDFDBO[], refresh = false): Promise<void> {
    if (files.length === 0) {
      return;
    }

    const operations = FullTextElasticDocumentMapper.toDocuments(
      files,
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

export { FullTextESWriter };
export type { FullTextESWriterDeps };
