import { ThesauriDataSource } from 'api/core/domain/template/propertyCreatorService/SelectPropertyCreatorService';
import thesauri from 'api/thesauri';

class MongoThesauriDataSource implements ThesauriDataSource {
  async exists(id: string): Promise<boolean> {
    const doc = await thesauri.getById(id);

    return Boolean(doc);
  }
}

export { MongoThesauriDataSource };
