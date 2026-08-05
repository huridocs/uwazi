import { DateTime } from 'luxon';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { formatDateProperty } from '#V2/formatters/metadata/formatDateProperty.js';
import { formatSelectProperty } from '#V2/formatters/metadata/formatSelectProperty.js';
import { formatSimpleProperty } from '#V2/formatters/metadata/formatSimpleProperty.js';
import {
  formatMetadataDisplayValue,
  formatMetadataTimestamp,
  metadataDisplayPresets,
} from '../index.js';

const context = { ...metadataDisplayPresets.compact, locale: 'en' };

describe('formatMetadataTimestamp', () => {
  it('formats unix seconds with locale', () => {
    const formatted = formatMetadataTimestamp(1717027200, context);
    expect(formatted).toBe(
      DateTime.fromSeconds(1717027200, { zone: 'utc' })
        .setLocale('en')
        .toLocaleString(DateTime.DATE_MED)
    );
  });

  it('normalizes millisecond timestamps', () => {
    expect(formatMetadataTimestamp(1717027200000, context)).toBe(
      formatMetadataTimestamp(1717027200, context)
    );
  });
});

describe('formatMetadataDisplayValue', () => {
  it('formats structured text metadata', () => {
    const property = formatSimpleProperty(
      { _id: '1', name: 'title', label: 'Title', type: 'text' },
      { title: [{ value: 'Emergency report' }] }
    );
    expect(property && formatMetadataDisplayValue(property, context)).toBe('Emergency report');
  });

  it('formats structured date metadata', () => {
    const property = formatDateProperty(
      { _id: 'd1', name: 'single_date', label: 'Date', type: 'date' },
      { single_date: [{ value: 1717027200 }] }
    );
    expect(property && formatMetadataDisplayValue(property, context)).toBe(
      formatMetadataTimestamp(1717027200, context)
    );
  });

  it('formats structured select metadata with parent label', () => {
    const property = formatSelectProperty(
      { _id: 's1', name: 'gender', label: 'Gender', type: 'select' },
      {
        gender: [{ value: 'm1', label: 'Male', parent: { value: 'p1', label: 'Biological' } }],
      }
    );
    expect(property && formatMetadataDisplayValue(property, context)).toBe('Biological: Male');
  });

  it('formats date ranges with a separator', () => {
    const property: MetadataProperty = {
      _id: 'dr1',
      name: 'range',
      label: 'Range',
      type: 'daterange',
      values: [{ value: { from: 1717027200, to: 1717113600 } }],
    };
    const formatted = formatMetadataDisplayValue(property, context);
    expect(formatted).toContain('~');
  });

  it('formats related entity titles', () => {
    const property: MetadataProperty = {
      _id: 'r1',
      name: 'rel',
      label: 'Related',
      type: 'relationship',
      mode: 'related',
      values: [{ _id: 'e1', title: 'Person 1' }],
    };
    expect(formatMetadataDisplayValue(property, context)).toBe('Person 1');
  });
});
