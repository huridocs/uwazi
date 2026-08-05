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
