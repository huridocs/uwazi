import type { Settings } from '#shared/types/settingsType.js';
import {
  getPublicSettingsPayload,
  omitInlineCustomization,
  pickPublicFields,
  shapeSettingsForSSR,
} from '../publicSettings.js';

jest.mock('#api/tenants/index.js', () => ({
  tenants: {
    current: () => ({ featureFlags: { themeCustomization: true } }),
  },
}));

describe('publicSettings', () => {
  const fullSettings = {
    site_name: 'Uwazi',
    languages: [{ key: 'en', label: 'English', default: true }],
    private: false,
    mailerConfig: 'smtp://secret',
    contactEmail: 'admin@example.com',
    customCSS: 'body { color: red; }',
    customJS: 'console.log(1)',
    allowcustomJS: true,
    features: { newHeader: true, ocr: { url: 'http://ocr' } },
  } as unknown as Settings;

  describe('pickPublicFields', () => {
    it('should keep only whitelisted fields', () => {
      const result = pickPublicFields(fullSettings);
      expect(result.site_name).toBe('Uwazi');
      expect(result.customCSS).toBe('body { color: red; }');
      expect(result.allowcustomJS).toBe(true);
      expect((result as Settings).mailerConfig).toBeUndefined();
      expect((result as Settings).contactEmail).toBeUndefined();
      expect((result as Settings).features).toBeUndefined();
    });
  });

  describe('getPublicSettingsPayload', () => {
    it('should include themeCustomization from the tenant', () => {
      expect(getPublicSettingsPayload(fullSettings).themeCustomization).toBe(true);
    });
  });

  describe('shapeSettingsForSSR', () => {
    it('should whitelist settings for non-admin users and preserve features', () => {
      const result = shapeSettingsForSSR(
        { ...fullSettings, features: { newHeader: true, paragraphExtraction: true } },
        { role: 'editor' }
      );

      expect(result.site_name).toBe('Uwazi');
      expect(result.mailerConfig).toBeUndefined();
      expect(result.features).toEqual({ newHeader: true, paragraphExtraction: true });
      expect(result.themeCustomization).toBe(true);
    });

    it('should keep full settings for admins while ensuring public fields and features', () => {
      const result = shapeSettingsForSSR(fullSettings, { role: 'admin' });

      expect(result.mailerConfig).toBe('smtp://secret');
      expect(result.contactEmail).toBe('admin@example.com');
      expect(result.features).toEqual({ newHeader: true, ocr: { url: 'http://ocr' } });
      expect(result.themeCustomization).toBe(true);
    });

    it('should whitelist settings for anonymous users', () => {
      const result = shapeSettingsForSSR(fullSettings, null);
      expect(result.mailerConfig).toBeUndefined();
      expect(result.site_name).toBe('Uwazi');
    });
  });

  describe('omitInlineCustomization', () => {
    it('should remove customCSS and customJS but keep allowcustomJS', () => {
      expect(
        omitInlineCustomization({
          site_name: 'Uwazi',
          customCSS: 'a {}',
          customJS: 'b()',
          allowcustomJS: true,
        })
      ).toEqual({
        site_name: 'Uwazi',
        allowcustomJS: true,
      });
    });
  });
});
