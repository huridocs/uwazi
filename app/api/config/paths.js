const { UPLOADS_FOLDER, CUSTOM_UPLOADS_FOLDER } = process.env;

export default {
  uploadDocumentsPath: UPLOADS_FOLDER || `${__dirname}/../../../uploaded_documents/`,
  attachmentsPath: UPLOADS_FOLDER || `${__dirname}/../../../uploaded_documents/`,
  customUploadsPath: CUSTOM_UPLOADS_FOLDER || `${__dirname}/../../../custom_uploads/`
};
