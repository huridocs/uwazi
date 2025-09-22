import { ThesauriDataSource } from '../../../domain/template/propertyCreatorService/SelectPropertyCreatorService.js';
import thesauri from '../../../../thesauri/index.js';

class MongoThesauriDataSource implements ThesauriDataSource {
  async exists(id: string): Promise<boolean> {
    const doc = await thesauri.getById(id);

    return Boolean(doc);
  }
}

export { MongoThesauriDataSource };
