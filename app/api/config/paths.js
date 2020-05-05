const { ROOT_PATH, UPLOADS_FOLDER, CUSTOM_UPLOADS_FOLDER, TEMPORAL_FILES_FOLDER } = process.env;

const rootPath = ROOT_PATH || `${__dirname}/../../../`;
const uploadedDocuments = UPLOADS_FOLDER || `${rootPath}/uploaded_documents/`;
const attachments = UPLOADS_FOLDER || `${rootPath}/uploaded_documents/`;
const customUploads = CUSTOM_UPLOADS_FOLDER || `${rootPath}/custom_uploads/`;
const temporalFiles = TEMPORAL_FILES_FOLDER || `${rootPath}/temporal_files/`;
const publicAssets = `${rootPath}/public/`;

export default {
  rootPath,
  attachments,
  customUploads,
  uploadedDocuments,
  publicAssets,
  temporalFiles,
};
