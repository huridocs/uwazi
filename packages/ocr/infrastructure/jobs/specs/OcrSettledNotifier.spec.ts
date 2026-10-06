import { OcrStatus } from '../../../domain/OcrStatus.js';
import { OcrSettledNotifier } from '../OcrSettledNotifier.js';

describe('OcrSettledNotifier', () => {
  const sockets = {
    emitToTenant: jest.fn(),
    emitToTenantAdmins: jest.fn(),
    emitToTenantAdminsAndEditors: jest.fn(),
    emitToSession: jest.fn(),
  };
  const notifier = new OcrSettledNotifier({ sockets, tenantName: 'tenant' });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [OcrStatus.READY, 'ocr:ready'],
    [OcrStatus.FAILED, 'ocr:error'],
  ] as const)('should tell the editors a %s record settled', (status, event) => {
    notifier.notify({ status, sourceFileId: 'file1' });

    expect(sockets.emitToTenantAdminsAndEditors).toHaveBeenCalledWith('tenant', event, 'file1');
  });

  it('should tell no one when nothing settled', () => {
    notifier.notify(undefined);

    expect(sockets.emitToTenantAdminsAndEditors).not.toHaveBeenCalled();
  });
});
