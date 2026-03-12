import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import { ThesauriDataSourceFactory } from '#api/core/infrastructure/factories/ThesauriDataSourceFactory.js';
import { MongoTransactionManager } from '#api/core/infrastructure/mongodb/common/MongoTransactionManager.js';
import { ThesauriDataSource } from '#api/core/application/contracts/ThesauriDataSource.js';
import { Thesaurus, ThesaurusValue } from '#api/core/domain/thesaurus/Thesaurus.js';
import {
  ThesauriRepository,
  ThesaurusValueInput,
} from '../../application/contracts/ThesauriRepository.js';

const mapValuesToSchema = (values: ThesaurusValue[] | undefined): ThesaurusSchema['values'] =>
  values?.map(value => ({
    id: value.id,
    label: value.label,
    values: value.values?.map(nested => ({
      id: nested.id,
      label: nested.label,
    })),
  }));

const toSchema = (thesaurus: Thesaurus): ThesaurusSchema => ({
  name: thesaurus.name,
  values: mapValuesToSchema(thesaurus.values),
});

export class CsvThesauriRepository implements ThesauriRepository {
  private thesauriDS: ThesauriDataSource;

  constructor(private transactionManager: MongoTransactionManager) {
    this.thesauriDS = ThesauriDataSourceFactory.default(this.transactionManager);
  }

  async getById(thesaurusId: string): Promise<ThesaurusSchema> {
    const thesaurus = (await this.thesauriDS.getById(thesaurusId)).getDataOrThrow();
    return toSchema(thesaurus);
  }

  async appendValues(thesaurusId: string, values: ThesaurusValueInput[]): Promise<ThesaurusSchema> {
    if (!values.length) {
      return this.getById(thesaurusId);
    }

    const current = (await this.thesauriDS.getById(thesaurusId)).getDataOrThrow();
    const updated = current.addValues(values);
    await this.thesauriDS.update(updated);
    return toSchema(updated);
  }
}
