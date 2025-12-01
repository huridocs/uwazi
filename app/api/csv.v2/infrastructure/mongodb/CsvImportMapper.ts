import { CsvImport } from '../../domain/CsvImport';
import { CsvImportDBO } from '../schemas/CsvImportTypes';

const CsvImportMapper = {
  toDBO(domain: Omit<CsvImport, 'id'>): CsvImportDBO {
    return { ...domain };
  },

  toDomain(dbo: CsvImportDBO): CsvImport {
    const { _id, ...rest } = dbo as any;
    return { id: (_id || '').toString(), ...(rest as Omit<CsvImport, 'id'>) };
  },
};

export { CsvImportMapper };
