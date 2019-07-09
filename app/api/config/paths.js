const { UPLOADS_FOLDER, CUSTOM_UPLOADS_FOLDER } = process.env;

const uploadedDocuments = UPLOADS_FOLDER || `${__dirname}/../../../uploaded_documents/`;
const attachments = UPLOADS_FOLDER || `${__dirname}/../../../uploaded_documents/`;
const customUploads = CUSTOM_UPLOADS_FOLDER || `${__dirname}/../../../custom_uploads/`;

export default {
  attachments,
  customUploads,
  uploadedDocuments,
};
