import { V1WebSocketsWrapper } from 'api/core/infrastructure/services/V1WebSocketsWrapper';
import { tenants } from 'api/tenants/tenantContext';
import { handleError } from 'api/utils';
import { CsvImportRowErrorsDataSource } from '../../application/contracts/CsvImportRowErrorsDataSource';

type RowExceptionsPayload = Record<
  string,
  Array<{
    index: number;
    property: string;
    value: string;
    reason: string;
  }>
>;

const buildRowExceptionsPayload = async (
  rowErrorsDS: CsvImportRowErrorsDataSource,
  importId: string
): Promise<RowExceptionsPayload | undefined> => {
  const errors = await rowErrorsDS.getByImport(importId);
  if (!errors.length) {
    return undefined;
  }

  return errors.reduce<RowExceptionsPayload>((acc, error) => {
    const reason = error.message || 'Row errors';
    if (!acc[reason]) {
      acc[reason] = [];
    }
    acc[reason].push({
      index: error.rowIndex,
      property: '',
      value: '',
      reason: '',
    });
    return acc;
  }, {});
};

const isCompatEnabled = () => Boolean(tenants.current().featureFlags?.v1CSVImportCompat);

class CsvV1CompatEmitter {
  constructor(
    private deps: {
      sockets: V1WebSocketsWrapper;
      rowErrorsDS?: CsvImportRowErrorsDataSource;
    }
  ) {}

  start(tenantName: string) {
    if (!isCompatEnabled()) {
      return;
    }
    this.deps.sockets.emitToTenantAdmins(tenantName, 'IMPORT_CSV_START');
  }

  progress(tenantName: string, loaded: number) {
    if (!isCompatEnabled()) {
      return;
    }
    this.deps.sockets.emitToTenantAdmins(tenantName, 'IMPORT_CSV_PROGRESS', loaded);
  }

  async rowExceptions(tenantName: string, importId: string) {
    if (!isCompatEnabled()) {
      return;
    }
    if (!this.deps.rowErrorsDS) {
      return;
    }
    const payload = await buildRowExceptionsPayload(this.deps.rowErrorsDS, importId);
    if (!payload) {
      return;
    }
    this.deps.sockets.emitToTenantAdmins(tenantName, 'IMPORT_CSV_ROW_EXCEPTIONS', payload);
  }

  error(tenantName: string, error: Error) {
    if (!isCompatEnabled()) {
      return;
    }
    this.deps.sockets.emitToTenantAdmins(tenantName, 'IMPORT_CSV_ERROR', handleError(error));
  }

  end(tenantName: string) {
    if (!isCompatEnabled()) {
      return;
    }
    this.deps.sockets.emitToTenantAdmins(tenantName, 'IMPORT_CSV_END');
  }
}

export { CsvV1CompatEmitter };
