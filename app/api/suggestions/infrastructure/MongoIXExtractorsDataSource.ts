import { MongoDataSource } from 'api/common.v2/database/MongoDataSource';
import { MongoTransactionManager } from 'api/common.v2/database/MongoTransactionManager';
import { Db, ObjectId } from 'mongodb';
import { IXExtractorsDataSource } from '../domain/IXExtractorsDataSource';
import { MongoIXExtractorDBO } from './MongoIXExtractorDBO';
import { IXExtractor, IXExtractorProps } from '../domain/IXExtractor';

export const mongoIXExtractorsCollection = 'ixextractors';

export class MongoIXExtractorsDataSource
  extends MongoDataSource<MongoIXExtractorDBO>
  implements IXExtractorsDataSource
{
  protected collectionName = mongoIXExtractorsCollection;

  constructor(db: Db, transactionManager: MongoTransactionManager) {
    super(db, transactionManager);
  }

  private toDomain(dbo: MongoIXExtractorDBO): IXExtractor {
    const props: IXExtractorProps = {
      id: dbo._id.toString(),
      name: dbo.name,
      property: dbo.property,
      templates: dbo.templates.map(id => id.toString()),
      source: dbo.source,
    };

    return new IXExtractor(props);
  }

  async getById(id: string): Promise<IXExtractor | null> {
    const dbo = await this.getCollection().findOne({ _id: new ObjectId(id) });

    if (!dbo) {
      return null;
    }

    return this.toDomain(dbo);
  }
}
