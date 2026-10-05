import { OcrRecordDataSource } from '../../application/contracts/OcrRecordDataSource.js';
import { MongoOcrRecordDataSource } from '../mongodb/MongoOcrRecordDataSource.js';
import { PostgresOcrRecordDataSource } from '../postgresql/PostgresOcrRecordDataSource.js';
import { OcrRecordDAOFactory } from './OcrRecordDAOFactory.js';

class OcrRecordDataSourceFactory {
  static default(): OcrRecordDataSource {
    const selected = OcrRecordDAOFactory.default();

    return selected.backend === 'postgres'
      ? new PostgresOcrRecordDataSource({ dao: selected.dao })
      : new MongoOcrRecordDataSource({ dao: selected.dao });
  }
}

export { OcrRecordDataSourceFactory };
