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
    ).toEqual({ text: '35° 53′ 60″ S, 65° 0′ 0″ W', interactive: true });
  });

  it('shows geolocation coordinates with the point label', () => {
    expect(
      libraryTableCellValue(
        'geolocation',
        [{ value: { latitude: 1, longitude: 2 }, label: 'HQ' }],
        context
      )
    ).toEqual({ text: 'HQ: 1° 0′ 0″ N, 2° 0′ 0″ E', interactive: true });
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

  it('formats a link as its label and keeps the url', () => {
    expect(
      libraryTableCellValue(
        'link',
        [{ value: { label: 'google', url: 'https://google.com' } }],
        context
      )
    ).toEqual({
      text: 'google',
      interactive: false,
      links: [{ label: 'google', href: 'https://google.com' }],
    });
  });

  it('uses the url as the link label when no label is stored', () => {
    expect(libraryTableCellValue('link', [{ value: { url: 'google.com' } }], context)).toEqual({
      text: 'google.com',
      interactive: false,
      links: [{ label: 'google.com', href: 'google.com' }],
    });
  });

  it('keeps each link when a property has several', () => {
    expect(
      libraryTableCellValue(
        'link',
        [
          { value: { label: 'first', url: 'https://first.example' } },
          { value: { label: 'second', url: 'https://second.example' } },
        ],
        context
      )
    ).toEqual({
      text: 'first, second',
      interactive: false,
      links: [
        { label: 'first', href: 'https://first.example' },
        { label: 'second', href: 'https://second.example' },
      ],
    });
  });
});

describe('libraryTableCellValue inherited values', () => {
  it('formats the inherited leaf instead of the related entity name', () => {
    expect(
      libraryTableCellValue(
        'relationship',
        [
          {
            value: 'entity-1',
            label: 'Parent entity',
            inheritedType: 'text',
            inheritedValue: [{ value: 'final text' }],
          },
        ],
        context
      )
    ).toEqual({ text: 'final text', interactive: false });
  });

  it('leaves an inherited media file blank in the table', () => {
    expect(
      libraryTableCellValue(
        'relationship',
        [
          {
            label: 'Parent entity',
            inheritedType: 'media',
            inheritedValue: [{ value: '/api/files/hearing.mp4', alt: 'hearing.mp4' }],
          },
        ],
        { ...context, omitFileText: true }
      )
    ).toEqual({ text: '', interactive: false });
  });

  it('shows inherited geolocation coordinates', () => {
    expect(
      libraryTableCellValue(
        'relationship',
        [
          {
            label: 'Parent entity',
            inheritedType: 'geolocation',
            inheritedValue: [{ value: { lat: 1, lon: 2, label: 'HQ' } }],
          },
        ],
        context
      )
    ).toEqual({ text: 'HQ: 1° 0′ 0″ N, 2° 0′ 0″ E', interactive: true });
  });

  it('leaves an inherited image blank in the table', () => {
    expect(
      libraryTableCellValue(
        'relationship',
        [
          {
            label: 'Parent entity',
            inheritedType: 'image',
            inheritedValue: [{ value: '/api/files/1792633213296onctb95tx1s.png' }],
          },
        ],
        { ...context, omitFileText: true }
      )
    ).toEqual({ text: '', interactive: false });
  });

  it('formats an inherited date from the template type when the row has none', () => {
    expect(
      libraryTableCellValue(
        'relationship',
        [
          {
            label: 'Parent entity',
            inheritedValue: [{ value: 1704067200 }],
          },
        ],
        { ...context, inheritedType: 'date' }
      )
    ).toEqual({ text: 'Jan 1, 2024', interactive: false });
  });

  it('formats an inherited date with the leaf type', () => {
    expect(
      libraryTableCellValue(
        'relationship',
        [
          {
            label: 'Parent entity',
            inheritedType: 'date',
            inheritedValue: [{ value: 1704067200 }],
          },
        ],
        context
      )
    ).toEqual({ text: 'Jan 1, 2024', interactive: false });
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
