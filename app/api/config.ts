import { Tenant } from './odm/tenantContext';

const { ROOT_PATH, UPLOADS_FOLDER, CUSTOM_UPLOADS_FOLDER, TEMPORAL_FILES_FOLDER } = process.env;

const rootPath = ROOT_PATH || `${__dirname}/../../`;

export const config = {
  PORT: process.env.PORT || 3000,

  DBHOST: process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/',

  rootPath,

  publicAssets: `${rootPath}/public/`,

  // db for tenants list and sessions
  SHARED_DB: 'uwazi_shared_db',

  defaultTenant: <Tenant>{
    dbName: process.env.DATABASE_NAME || 'uwazi_development',
    indexName: process.env.INDEX_NAME || 'uwazi_development',
    uploadedDocuments: UPLOADS_FOLDER || `${rootPath}/uploaded_documents/`,
    attachments: UPLOADS_FOLDER || `${rootPath}/uploaded_documents/`,
    customUploads: CUSTOM_UPLOADS_FOLDER || `${rootPath}/custom_uploads/`,
    temporalFiles: TEMPORAL_FILES_FOLDER || `${rootPath}/temporal_files/`,
  },
};
