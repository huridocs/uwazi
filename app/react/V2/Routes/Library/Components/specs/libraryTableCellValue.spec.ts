import { metadataDisplayPresets } from '#V2/Components/Metadata/display/index.js';
import { formatLibraryTableDate, libraryTableCellValue } from '../libraryTableCellValue.js';

const context = { ...metadataDisplayPresets.compact, locale: 'en' };

describe('libraryTableCellValue', () => {
  it('returns empty text for missing values', () => {
    expect(libraryTableCellValue('select', undefined, context)).toEqual({
      text: '',
      interactive: false,
    });
  });

  it('formats select labels', () => {
    expect(libraryTableCellValue('select', [{ value: 'ngo', label: 'NGO' }], context)).toEqual({
      text: 'NGO',
      interactive: false,
    });
  });

  it('formats geolocation with latitude and longitude labels', () => {
    expect(
      libraryTableCellValue(
        'geolocation',
        [{ value: { lat: -35.9, lon: -65 }, label: '' }],
        context
      )
    ).toEqual({ text: 'Latitude: -35.9, Longitude: -65', interactive: true });
  });

  it('prefers a geolocation label when present', () => {
    expect(
      libraryTableCellValue(
        'geolocation',
        [{ value: { latitude: 1, longitude: 2 }, label: 'HQ' }],
        context
      )
    ).toEqual({ text: 'HQ', interactive: true });
  });

  it('formats media as a filename and marks it interactive', () => {
    expect(
      libraryTableCellValue(
        'media',
        [{ value: '/api/files/hearing.mp4', alt: 'hearing.mp4' }],
        context
      )
    ).toEqual({ text: 'hearing.mp4', interactive: true });
  });

  it('falls back to the URL basename for media without alt', () => {
    expect(
      libraryTableCellValue('image', [{ value: 'https://cdn.example/docs/scan.jpg' }], context)
    ).toEqual({ text: 'scan.jpg', interactive: true });
  });
});

describe('formatLibraryTableDate', () => {
  it('formats timestamps with the navigation locale', () => {
    expect(formatLibraryTableDate(1704067200000, context)).toBe('January 1, 2024');
    expect(formatLibraryTableDate(1704067200000, { ...context, locale: 'es' })).toBe(
      '1 de enero de 2024'
    );
  });

  it('returns empty text for missing timestamps', () => {
    expect(formatLibraryTableDate(undefined, context)).toBe('');
  });
});
