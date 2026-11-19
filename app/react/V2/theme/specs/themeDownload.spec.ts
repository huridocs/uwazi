/**
 * @jest-environment jsdom
 */
import { downloadThemeInstance } from '../themeInstanceExport.js';

const installUrl = () => {
  const revoke = jest.fn();
  Object.assign(URL, {
    createObjectURL: () => 'blob:theme',
    revokeObjectURL: revoke,
  });
  return revoke;
};

describe('downloadThemeInstance', () => {
  it('attaches the download link before clicking', () => {
    installUrl();
    const append = jest.spyOn(document.body, 'appendChild');
    downloadThemeInstance('{}');
    const link = append.mock.calls.find(([node]) => node instanceof HTMLAnchorElement)?.[0] as
      HTMLAnchorElement | undefined;
    expect(link?.isConnected).toBe(false);
    append.mockRestore();
  });

  it('revokes the blob url after the click', () => {
    jest.useFakeTimers();
    const revoke = installUrl();
    downloadThemeInstance('{}');
    expect(revoke).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(revoke).toHaveBeenCalledWith('blob:theme');
    jest.useRealTimers();
  });
});
