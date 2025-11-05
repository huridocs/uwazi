export type RegisterCsvImportInput = {
  template: string;
  file: {
    path: string;
    originalname: string;
    mimetype: string;
    size: number;
  };
  userId: string;
};

export type RegisterCsvImportOutput = {
  importId: string;
  status: 'queued';
  message: string;
};
