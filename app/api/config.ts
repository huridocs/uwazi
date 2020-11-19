import uniqueID from 'shared/uniqueID';
import { Tenant } from './tenants/tenantContext';

const {
  ROOT_PATH,
  UPLOADS_FOLDER,
  CUSTOM_UPLOADS_FOLDER,
  TEMPORAL_FILES_FOLDER,
  USER_SESSION_SECRET,
} = process.env;

const rootPath = ROOT_PATH || `${__dirname}/../../`;

// this needs to be true in order for uwazi to work properly
// when using multiple node processes
const CLUSTER_MODE = process.env.CLUSTER_MODE || false;

export const config = {
  PORT: process.env.PORT || 3000,

  DBHOST: process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/',

  rootPath,

  publicAssets: `${rootPath}/public/`,

  userSessionSecret: USER_SESSION_SECRET || uniqueID(),

  // db for tenants list and sessions
  SHARED_DB: 'uwazi_shared_db',

  multiTenant: process.env.MULTI_TENANT || false,
  clusterMode: CLUSTER_MODE,
  defaultTenant: <Tenant>{
    name: 'default',
    dbName: process.env.DATABASE_NAME || 'uwazi_development',
    indexName: process.env.INDEX_NAME || 'uwazi_development',
    uploadedDocuments: UPLOADS_FOLDER || `${rootPath}/uploaded_documents/`,
    attachments: UPLOADS_FOLDER || `${rootPath}/uploaded_documents/`,
    customUploads: CUSTOM_UPLOADS_FOLDER || `${rootPath}/custom_uploads/`,
    temporalFiles: TEMPORAL_FILES_FOLDER || `${rootPath}/temporal_files/`,
  },

  redis: {
    activated: CLUSTER_MODE,
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  },
};
