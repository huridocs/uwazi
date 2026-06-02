import { CsvImportDomain, CsvImportStatus } from '../../../domain/CsvImport.js';
import { CancelCsvImportEntitiesImportUseCase } from '../CancelCsvImportEntitiesImportUseCase.js';

jest.mock('#api/tenants/tenantContext.js', () => ({
  tenants: {
    current: () => ({ name: 'test-tenant' }),
  },
}));

describe('CancelCsvImportEntitiesImportUseCase', () => {
  it('cancels a non-terminal import and is idempotent', async () => {
    const csvImport = CsvImportDomain.withStatus(
      CsvImportDomain.create({
        id: 'cancel-target',
        templateId: 'template-cancel',
        file: { originalName: 'cancel.csv', mimeType: 'text/csv', size: 10 },
        createdBy: 'user-cancel',
      }),
      CsvImportStatus.PreflightScan
    );
    const cancelledImport = CsvImportDomain.withStatus(csvImport, CsvImportStatus.Cancelled);
    const csvImportEntitiesImportsDS = {
      getById: jest
        .fn()
        .mockResolvedValueOnce({ getDataOrThrow: () => csvImport })
        .mockResolvedValueOnce({ getDataOrThrow: () => cancelledImport })
        .mockResolvedValueOnce({ getDataOrThrow: () => cancelledImport }),
      cancel: jest.fn().mockResolvedValue(undefined),
    };
    const sockets = { emitToTenantAdmins: jest.fn() };
    const useCase = new CancelCsvImportEntitiesImportUseCase({
      csvImportEntitiesImportsDS: csvImportEntitiesImportsDS as any,
      sockets: sockets as any,
    });

    const first = await useCase.execute({ id: csvImport.id });
    const second = await useCase.execute({ id: csvImport.id });

    expect(first).toEqual({ id: csvImport.id, status: CsvImportStatus.Cancelled, cancelled: true });
    expect(second).toEqual({
      id: csvImport.id,
      status: CsvImportStatus.Cancelled,
      cancelled: true,
    });
    expect(csvImportEntitiesImportsDS.cancel).toHaveBeenCalledTimes(1);
    expect(sockets.emitToTenantAdmins).toHaveBeenCalledWith(
      'test-tenant',
      'csvImport:import:cancelled',
      { importId: csvImport.id }
    );
    expect(sockets.emitToTenantAdmins).toHaveBeenCalledTimes(1);
  });

  it('returns no-op for terminal imports without rewriting status', async () => {
    const csvImport = CsvImportDomain.withStatus(
      CsvImportDomain.create({
        id: 'cancel-terminal',
        templateId: 'template-terminal',
        file: { originalName: 'terminal.csv', mimeType: 'text/csv', size: 10 },
        createdBy: 'user-terminal',
      }),
      CsvImportStatus.ImportEntitiesDone
    );
    const csvImportEntitiesImportsDS = {
      getById: jest.fn().mockResolvedValue({ getDataOrThrow: () => csvImport }),
      cancel: jest.fn().mockResolvedValue(undefined),
    };
    const sockets = { emitToTenantAdmins: jest.fn() };
    const useCase = new CancelCsvImportEntitiesImportUseCase({
      csvImportEntitiesImportsDS: csvImportEntitiesImportsDS as any,
      sockets: sockets as any,
    });

    const response = await useCase.execute({ id: csvImport.id });

    expect(response).toEqual({
      id: csvImport.id,
      status: CsvImportStatus.ImportEntitiesDone,
      cancelled: false,
    });
    expect(csvImportEntitiesImportsDS.cancel).not.toHaveBeenCalled();
  });
});
