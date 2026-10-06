/** What `GET /api/files/:filename/ocr` answers, as clients have always read it. */
type GetOcrStatusResponse = {
  status: 'noOCR' | 'inQueue' | 'cannotProcess' | 'withOCR' | 'unsupported_language';
  lastUpdated?: number;
};

export type { GetOcrStatusResponse };
