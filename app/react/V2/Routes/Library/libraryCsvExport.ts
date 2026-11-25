import { APIURL } from '#app/config.js';

const libraryCsvExportIds = (selectedIds: readonly string[], loadedIds: readonly string[]) =>
  selectedIds.length > 0 ? [...selectedIds] : [...loadedIds];

const libraryCsvExportBody = (ids: readonly string[]) => ({
  ids: [...ids],
  limit: ids.length,
  includeUnpublished: true,
});

const extractUtf8FileName = (contentDisposition: string) => {
  const utf8FileNameMatch = contentDisposition.match(/filename\*\s*=\s*([^;]+)/i);
  if (!utf8FileNameMatch) {
    return null;
  }

  const removeDoubleQuotes = utf8FileNameMatch[1].trim().replace(/^"|"$/g, '');
  const removeUTF8Lang = removeDoubleQuotes.replace(/^[^']*'[^']*'/, '');
  try {
    return decodeURIComponent(removeUTF8Lang);
  } catch (_error) {
    return null;
  }
};

const extractAsciiFileName = (contentDisposition: string) => {
  const getFilename = contentDisposition.match(/filename\s*=\s*"?([^";]+)"?/i);
  return getFilename?.[1].trim() || null;
};

const fileNameFromContentDisposition = (contentDisposition: string | null) => {
  if (!contentDisposition) {
    return 'export.csv';
  }

  if (/filename\*/i.test(contentDisposition)) {
    return extractUtf8FileName(contentDisposition) || 'export.csv';
  }

  return extractAsciiFileName(contentDisposition) || 'export.csv';
};

const downloadCsvFile = (content: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url));
};

const downloadLibraryCsv = async (ids: readonly string[]) => {
  if (ids.length === 0) {
    return;
  }

  const response = await fetch(`${APIURL}export`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      Accept: 'text/csv',
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(libraryCsvExportBody(ids)),
  });

  if (!response.ok) {
    throw new Error('export failed');
  }

  const content = await response.text();
  downloadCsvFile(
    content,
    fileNameFromContentDisposition(response.headers.get('content-disposition'))
  );
};

export {
  downloadLibraryCsv,
  fileNameFromContentDisposition,
  libraryCsvExportBody,
  libraryCsvExportIds,
};
