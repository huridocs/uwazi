/**
 * @jest-environment jsdom
 */
import { APIURL } from '#app/config.js';
import {
  downloadLibraryCsv,
  fileNameFromContentDisposition,
  libraryCsvExportBody,
  libraryCsvExportIds,
} from '../libraryCsvExport.js';

const csvResponse = (contentDisposition: string | null, ok = true) => ({
  ok,
  status: ok ? 200 : 500,
  text: async () => 'title\nMexico',
  headers: {
    get: (name: string) =>
      name.toLowerCase() === 'content-disposition' ? contentDisposition : null,
  },
});

describe('libraryCsvExportIds', () => {
  it('exports the loaded entities when nothing is selected', () => {
    expect(libraryCsvExportIds([], ['mexico', 'gelman'])).toEqual(['mexico', 'gelman']);
  });

  it('exports the selection instead of the loaded entities', () => {
    expect(libraryCsvExportIds(['gelman'], ['mexico', 'gelman'])).toEqual(['gelman']);
  });
});

describe('libraryCsvExportBody', () => {
  it('asks the export endpoint for those shared ids, including restricted ones', () => {
    expect(libraryCsvExportBody(['mexico', 'gelman'])).toEqual({
      ids: ['mexico', 'gelman'],
      limit: 2,
      includeUnpublished: true,
    });
  });
});

describe('fileNameFromContentDisposition', () => {
  it.each([
    {
      header:
        'attachment; filename="Uwazi ????-2026-05-14T13:32:35.777Z.csv"; filename*=UTF-8\'\'Uwazi%20%D0%9E%D0%A0%D0%9F%D0%9A-2026-05-14T13%3A32%3A35.777Z.csv',
      fileName: 'Uwazi ОРПК-2026-05-14T13:32:35.777Z.csv',
    },
    {
      header: 'attachment; filename="Uwazi-2026-05-14T13:32:53.411Z.csv"',
      fileName: 'Uwazi-2026-05-14T13:32:53.411Z.csv',
    },
    { header: '', fileName: 'export.csv' },
    { header: null, fileName: 'export.csv' },
  ])('reads $fileName', ({ header, fileName }) => {
    expect(fileNameFromContentDisposition(header)).toBe(fileName);
  });
});

describe('downloadLibraryCsv', () => {
  const fetchMock = jest.fn();
  let downloaded: string | undefined;

  beforeEach(() => {
    downloaded = undefined;
    fetchMock.mockReset();
    global.fetch = fetchMock;
    Object.assign(URL, { createObjectURL: () => 'blob:csv', revokeObjectURL: jest.fn() });
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
      this: HTMLAnchorElement
    ) {
      downloaded = this.download;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does nothing when there are no entities to export', async () => {
    await downloadLibraryCsv([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the ids and downloads the csv the endpoint returns', async () => {
    fetchMock.mockResolvedValue(csvResponse('attachment; filename="uwazi.csv"'));
    await downloadLibraryCsv(['mexico', 'gelman']);

    expect(fetchMock).toHaveBeenCalledWith(`${APIURL}export`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        Accept: 'text/csv',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        ids: ['mexico', 'gelman'],
        limit: 2,
        includeUnpublished: true,
      }),
    });

    expect(downloaded).toBe('uwazi.csv');
    expect(document.querySelector('a[download]')).toBeNull();
  });

  it('rejects when the export endpoint fails', async () => {
    fetchMock.mockResolvedValue(csvResponse(null, false));
    await expect(downloadLibraryCsv(['mexico'])).rejects.toThrow('export failed');
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
});
