import thesauri from '#api/thesauri/thesauri.js';
import { ThesaurusSchema } from '#shared/types/thesaurusType.js';
import {
  ThesauriRepository,
  ThesaurusValueInput,
} from '#api/csv.v2/application/contracts/ThesauriRepository.js';

export class LegacyThesauriRepository implements ThesauriRepository {
  // eslint-disable-next-line class-methods-use-this
  async getById(thesaurusId: string): Promise<ThesaurusSchema> {
    const thesaurus = await thesauri.getById(thesaurusId);
    if (!thesaurus) {
      throw new Error(`Thesaurus not found: ${thesaurusId}`);
    }
    return thesaurus;
  }

  async appendValues(thesaurusId: string, values: ThesaurusValueInput[]): Promise<ThesaurusSchema> {
    if (!values.length) {
      return this.getById(thesaurusId);
    }
    const current = await this.getById(thesaurusId);
    const updated = thesauri.appendValues(current, values);
    const saved = await thesauri.save({ ...updated, _id: current._id });
    return saved;
  }
}
