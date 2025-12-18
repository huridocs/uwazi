import { MongoThesauriDataSourceV2 } from './MongoThesauriDataSourceV2';

export class CachedMongoThesauriDataSource extends MongoThesauriDataSourceV2 {
  private cache = new Map<string, any>();

  override async getById(id: string) {
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    const thesaurus = await super.getById(id);
    this.cache.set(id, thesaurus);
    return thesaurus;
  }
}
