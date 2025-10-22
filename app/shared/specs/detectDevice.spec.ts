import { isMobileDevice, getUserAgent } from '../detectDevice';

describe('detectDevice', () => {
  describe('isMobileDevice', () => {
    it('should return true for iPhone User-Agent', () => {
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return true for iPad User-Agent', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return true for Android phone User-Agent', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return true for Android tablet User-Agent', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Safari/537.36';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return true for BlackBerry User-Agent', () => {
      const ua = 'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return true for Windows Phone User-Agent', () => {
      const ua =
        'Mozilla/5.0 (Windows Phone 10.0; Android 6.0.1; Microsoft; Lumia 950) AppleWebKit/537.36';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return true for Opera Mini User-Agent', () => {
      const ua =
        'Opera/9.80 (J2ME/MIDP; Opera Mini/9.80 (S60; SymbOS; Opera Mobi/23.348; U; en) Presto/2.5.25 Version/10.54';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return true for Chrome on iOS (CriOS)', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/92.0.4515.90 Mobile/15E148 Safari/604.1';
      expect(isMobileDevice(ua)).toBe(true);
    });

    it('should return false for desktop Chrome User-Agent', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
      expect(isMobileDevice(ua)).toBe(false);
    });

    it('should return false for desktop Firefox User-Agent', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';
      expect(isMobileDevice(ua)).toBe(false);
    });

    it('should return false for desktop Safari User-Agent', () => {
      const ua =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15';
      expect(isMobileDevice(ua)).toBe(false);
    });

    it('should return false for desktop Edge User-Agent', () => {
      const ua =
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';
      expect(isMobileDevice(ua)).toBe(false);
    });

    it('should return false for empty User-Agent', () => {
      expect(isMobileDevice('')).toBe(false);
    });

    it('should handle case-insensitive matching', () => {
      const ua = 'Mozilla/5.0 (iphone; CPU iPhone OS 14_7_1 like Mac OS X)';
      expect(isMobileDevice(ua)).toBe(true);
    });
  });

  describe('getUserAgent', () => {
    it('should extract User-Agent string from headers', () => {
      const headers = {
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
        accept: 'text/html',
      };
      expect(getUserAgent(headers)).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
      );
    });

    it('should return empty string when User-Agent is not present', () => {
      const headers = {
        accept: 'text/html',
      };
      expect(getUserAgent(headers)).toBe('');
    });

    it('should return empty string when User-Agent is an array', () => {
      const headers = {
        'user-agent': ['agent1', 'agent2'],
      };
      expect(getUserAgent(headers)).toBe('');
    });

    it('should handle empty headers object', () => {
      expect(getUserAgent({})).toBe('');
    });

    it('should handle undefined User-Agent', () => {
      const headers = {
        'user-agent': undefined,
      };
      expect(getUserAgent(headers)).toBe('');
    });
  });
});
