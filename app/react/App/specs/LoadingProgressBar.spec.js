/**
 * @jest-environment jsdom
 */
import * as notifyBridge from '#V2/utils/notifyBridge.js';
import { loadingProgressBar as LoadingProgressBar } from '../LoadingProgressBar.js';

jest.mock('#V2/utils/notifyBridge.js', () => ({
  startLoading: jest.fn(),
  endLoading: jest.fn(),
}));

describe('LoadingProgressBar', () => {
  beforeEach(() => {
    LoadingProgressBar.requests = 0;
    jest.clearAllMocks();
  });

  describe('start', () => {
    it('should increment request count and trigger startLoading', () => {
      LoadingProgressBar.start();
      expect(LoadingProgressBar.requests).toBe(1);
      expect(notifyBridge.startLoading).toHaveBeenCalled();
    });
  });

  describe('done', () => {
    it('should decrement request count and call endLoading when all requests finish', () => {
      LoadingProgressBar.requests = 1;
      LoadingProgressBar.done();
      expect(notifyBridge.endLoading).toHaveBeenCalled();
      expect(LoadingProgressBar.requests).toBe(0);
    });

    it('should not call endLoading while there are still pending requests', () => {
      LoadingProgressBar.requests = 2;
      LoadingProgressBar.done();
      expect(notifyBridge.endLoading).not.toHaveBeenCalled();
      expect(LoadingProgressBar.requests).toBe(1);
    });
  });
});
