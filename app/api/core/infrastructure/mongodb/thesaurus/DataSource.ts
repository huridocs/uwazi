import { ThesaurusDataSource } from 'api/core/domain/template/propertyCreatorService/SelectPropertyCreatorService';
import thesauri from 'api/thesauri';

class MongoThesaurusDataSource implements ThesaurusDataSource {
  async exists(id: string): Promise<boolean> {
    const doc = await thesauri.getById(id);

    return Boolean(doc);
  }
}

export { MongoThesaurusDataSource };
