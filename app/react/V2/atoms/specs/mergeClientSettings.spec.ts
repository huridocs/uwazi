import { mergeClientSettings } from '../mergeClientSettings.js';

describe('mergeClientSettings', () => {
  it('should merge features deeply', () => {
    expect(
      mergeClientSettings(
        { site_name: 'A', features: { newHeader: false } } as any,
        { features: { paragraphExtraction: true } } as any
      )
    ).toEqual({
      site_name: 'A',
      features: { newHeader: false, paragraphExtraction: true },
    });
  });

  it('should keep the v2 preview overlay when a save echoes the tenant flag off', () => {
    expect(
      mergeClientSettings(
        {
          site_name: 'A',
          themeCustomization: true,
          features: {
            newHeader: true,
            featureFlagLibraryV2: true,
            featureFlagEntityViewerv2: true,
            themeCustomization: true,
            ocr: { url: 'http://ocr' },
          },
        } as any,
        {
          site_name: 'A',
          themeCustomization: false,
          themeVars: { __preset: 'default' },
          features: {
            ocr: { url: 'http://ocr' },
            newHeader: false,
            featureFlagLibraryV2: false,
            featureFlagEntityViewerv2: false,
            themeCustomization: false,
          },
        } as any
      )
    ).toEqual({
      site_name: 'A',
      themeCustomization: true,
      themeVars: { __preset: 'default' },
      features: {
        ocr: { url: 'http://ocr' },
        newHeader: true,
        featureFlagLibraryV2: true,
        featureFlagEntityViewerv2: true,
        themeCustomization: true,
      },
    });
  });

  it('should accept feature-flag downgrades when theme customization stays on', () => {
    expect(
      mergeClientSettings(
        {
          themeCustomization: true,
          features: { newHeader: true, featureFlagLibraryV2: true },
        } as any,
        {
          themeCustomization: true,
          features: { newHeader: false, featureFlagLibraryV2: false },
        } as any
      )
    ).toEqual({
      themeCustomization: true,
      features: { newHeader: false, featureFlagLibraryV2: false },
    });
  });

  it('should omit customCSS and customJS from the merged settings', () => {
    expect(
      mergeClientSettings(
        { site_name: 'A', allowcustomJS: true } as any,
        {
          site_name: 'B',
          customCSS: 'body{}',
          customJS: 'alert(1)',
          allowcustomJS: true,
        } as any
      )
    ).toEqual({
      site_name: 'B',
      allowcustomJS: true,
      features: {},
    });
  });
});
