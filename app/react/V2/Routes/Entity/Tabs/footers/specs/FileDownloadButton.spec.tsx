/** @jest-environment jsdom */
import type { EntityFileRow } from '../../../Components/Files/types.js';
import { downloadRowsAsZip, fileDownloadUrl } from '../FileDownloadButton.js';

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

const readBlob = async (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('expected bytes'));
        return;
      }
      resolve(new TextDecoder().decode(reader.result));
    };
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsArrayBuffer(blob);
  });

const installBlobUrls = () => {
  if (typeof URL.createObjectURL !== 'function') {
    Object.defineProperty(URL, 'createObjectURL', { writable: true, value: () => '' });
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: () => undefined });
  }
};

const captureZipDownload = () => {
  installBlobUrls();
  const blobs: Blob[] = [];
  const clicked: string[] = [];
  jest.spyOn(global, 'fetch').mockImplementation(async input => new Response(String(input)));
  jest.spyOn(URL, 'createObjectURL').mockImplementation(value => {
    if (value instanceof Blob) blobs.push(value);
    return 'blob:zip';
  });
  jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function recordClick(
    this: HTMLAnchorElement
  ) {
    clicked.push(`${this.getAttribute('href')}|${this.download}`);
  });
  return { blobs, clicked };
};

const savedBlob = (blobs: Blob[]) => {
  const [saved] = blobs;
  if (!saved) throw new Error('expected a zip blob');
  return saved;
};

const expectZipEntries = (text: string) => {
  expect(text).toContain('Main.pdf');
  expect(text).toContain('Extra.pdf');
  expect(text).toContain('/api/files/main.pdf?download=true');
  expect(text).toContain('/api/files/extra.pdf?download=true');
};

describe('downloadRowsAsZip', () => {
  it('packs each selected file into one zip', async () => {
    const { blobs, clicked } = captureZipDownload();
    const first = row('pdf', {
      fileType: 'document',
      filename: 'main.pdf',
      originalname: 'Main.pdf',
    });
    const second = row('pdf', {
      fileType: 'attachment',
      filename: 'extra.pdf',
      originalname: 'Extra.pdf',
    });
    await downloadRowsAsZip([first, second], 'shared-1.zip');
    expect(clicked).toEqual(['blob:zip|shared-1.zip']);
    expectZipEntries(await readBlob(savedBlob(blobs)));
  });
});
