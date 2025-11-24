import { InputFile } from 'api/core/domain/files/InputFile';

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
