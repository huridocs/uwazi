/** @jest-environment jsdom */
import { confirmAddFilesUpload, type ConfirmAddFilePayload } from '../confirmAddFileUpload.js';

const mockUpload = jest.fn();
const mockNotify = jest.fn();

jest.mock('#V2/utils/notifyBridge.js', () => ({
  notify: (...args: unknown[]) => mockNotify(...args),
}));

jest.mock('#app/I18N/index.js', () => ({
  t: (_context: string, key: string) => key,
}));

jest.mock('#V2/api/files/index.js', () => ({
  UploadService: jest.fn().mockImplementation(() => ({
    upload: (...args: unknown[]) => mockUpload(...args),
    onProgress: jest.fn(),
  })),
  update: jest.fn(),
}));

const payload = (name: string): ConfirmAddFilePayload => ({
  file: new File(['x'], name, { type: 'text/plain' }),
  displayName: name,
  addAs: 'supporting',
});

const deps = () => ({
  entitySharedId: 'shared',
  mountedRef: { current: true },
  uploadServiceRef: { current: null },
  uploadHoldTimerRef: { current: null },
  uploadHoldResolveRef: { current: null },
  setUploadProgress: jest.fn(),
  closeAddFileModal: jest.fn(),
  refreshEntity: jest.fn().mockResolvedValue(undefined),
});

describe('confirmAddFilesUpload', () => {
  beforeEach(() => {
    mockUpload.mockReset();
    mockNotify.mockReset();
  });

  it('refreshes after a partial batch and leaves the modal open', async () => {
    mockUpload.mockResolvedValueOnce([{ _id: 'uploaded' }]).mockResolvedValueOnce([]);
    const uploadDeps = deps();
    const uploaded = await confirmAddFilesUpload([payload('a.txt'), payload('b.txt')], uploadDeps);
    expect(uploaded).toBe(1);
    expect(uploadDeps.refreshEntity).toHaveBeenCalledTimes(1);
    expect(uploadDeps.closeAddFileModal).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it('refreshes completed files when a later upload throws', async () => {
    mockUpload
      .mockResolvedValueOnce([{ _id: 'uploaded' }])
      .mockRejectedValueOnce(new Error('network'));
    const uploadDeps = deps();
    const uploaded = await confirmAddFilesUpload([payload('a.txt'), payload('b.txt')], uploadDeps);
    expect(uploaded).toBe(1);
    expect(uploadDeps.refreshEntity).toHaveBeenCalledTimes(1);
    expect(uploadDeps.closeAddFileModal).not.toHaveBeenCalled();
  });

  it('reports a batch where every file fails', async () => {
    mockUpload.mockResolvedValue([]);
    const uploadDeps = deps();
    const uploaded = await confirmAddFilesUpload([payload('a.txt')], uploadDeps);
    expect(uploaded).toBe(0);
    expect(uploadDeps.refreshEntity).not.toHaveBeenCalled();
    expect(uploadDeps.closeAddFileModal).not.toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('Something went wrong', 'error');
  });
});
