/** @jest-environment jsdom */
import type { EntityFileRow } from '../../../Components/Files/types.js';
import { fileDownloadUrl } from '../FileDownloadButton.js';

const row = (kind: EntityFileRow['kind'], raw: EntityFileRow['raw']): EntityFileRow => ({
  rowId: 'r1',
  displayName: 'Doc',
  kind,
  typeLabel: 'PDF',
  sizeLabel: '—',
  languageKey: '—',
  modifiedLabel: '—',
  category: 'supporting',
  fileType: raw.fileType,
  raw,
});

describe('fileDownloadUrl', () => {
  it('adds download=true when the row has a filename', () => {
    expect(fileDownloadUrl(row('pdf', { fileType: 'attachment', filename: 'report.pdf' }))).toBe(
      '/api/files/report.pdf?download=true'
    );
  });

  it('returns an empty string for a link', () => {
    expect(
      fileDownloadUrl(row('link', { fileType: 'externalURL', url: 'https://example.com/a' }))
    ).toBe('');
  });

  it('returns an empty string when the file is missing', () => {
    expect(fileDownloadUrl(row('document', { fileType: 'attachment' }))).toBe('');
  });
});
