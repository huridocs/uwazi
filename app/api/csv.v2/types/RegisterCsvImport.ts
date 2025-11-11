import { InputFile } from 'api/files.v2/model/InputFile';

export type RegisterCsvImportInput = {
  template: string;
  file: InputFile;
  userId: string;
  sessionId?: string;
};

export type RegisterCsvImportOutput = {
  id: string;
  status: 'queued';
  message: string;
};
