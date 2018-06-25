const UPLOADS_FOLDER = process.env.UPLOADS_FOLDER;

export default {
  uploadDocumentsPath: UPLOADS_FOLDER || `${__dirname}/../../../uploaded_documents/`,
  attachmentsPath: UPLOADS_FOLDER || `${__dirname}/../../../uploaded_documents/`
};
