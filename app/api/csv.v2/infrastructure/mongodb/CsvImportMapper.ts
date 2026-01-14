import { CsvImport, CsvImportDomain } from '../../domain/CsvImport';
import { CsvImportDBO } from '../schemas/CsvImportTypes';

const CsvImportMapper = {
  toDBO(domain: CsvImport): CsvImportDBO {
    const { id, ...rest } = domain.toObject();
    return { ...rest };
  },

  toDomain(dbo: CsvImportDBO): CsvImport {
    const { _id, ...rest } = dbo as any;
    return CsvImportDomain.from({
      id: (_id || '').toString(),
      ...(rest as Omit<CsvImport, 'id'>),
    } as CsvImportDomain);
  },
};

export { CsvImportMapper };
