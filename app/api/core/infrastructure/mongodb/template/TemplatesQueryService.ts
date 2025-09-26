import { getConnection } from 'api/common.v2/database/getConnectionForCurrentTenant';
import { TemplateDBO } from 'api/templates.v2/database/schemas/TemplateDBO';
import { Db } from 'mongodb';

class TemplatesQueryService {
  private db: Db;

  protected collectionName = 'templates';

  constructor() {
    this.db = getConnection();
  }

  get collection() {
    return this.db.collection<TemplateDBO>(this.collectionName);
  }
}

export { TemplatesQueryService };
