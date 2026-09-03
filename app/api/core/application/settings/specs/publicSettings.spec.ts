import type { Settings } from '#shared/types/settingsType.js';
import { omitInlineCustomization } from '#shared/settings/omitInlineCustomization.js';
import { getPublicSettingsPayload, shapeSettingsForSSR } from '../publicSettings.js';

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

  describe('getPublicSettingsPayload', () => {
    it('should keep only whitelisted fields and the tenant themeCustomization flag', () => {
      const result = getPublicSettingsPayload(fullSettings);
      expect(result.site_name).toBe('Uwazi');
      expect(result.customCSS).toBe('body { color: red; }');
      expect(result.allowcustomJS).toBe(true);
      expect(result.themeCustomization).toBe(true);
      expect((result as Settings).mailerConfig).toBeUndefined();
      expect((result as Settings).contactEmail).toBeUndefined();
      expect((result as Settings).features).toBeUndefined();
    });
  });

  describe('shapeSettingsForSSR', () => {
    it('should keep the already-projected settings and features', () => {
      const projected = {
        site_name: 'Uwazi',
        features: { newHeader: true, paragraphExtraction: true },
        themeCustomization: true,
      };

      expect(shapeSettingsForSSR(projected)).toEqual(projected);
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
