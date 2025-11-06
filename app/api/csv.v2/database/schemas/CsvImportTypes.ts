export interface CsvImportDBO {
  _id?: any;
  templateId: string;
  file: {
    originalName: string;
    mimeType: string;
    size: number;
  };
  storage?: {
    path: string;
    provider?: string;
    etag?: string;
    checksum?: string;
  };
  status: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  rowErrors?: any;
}
