import uniqueID from 'shared/uniqueID';
import { Tenant } from './tenants/tenantContext';
import { version } from '../../package.json';

const {
  ROOT_PATH,
  UPLOADS_FOLDER,
  CUSTOM_UPLOADS_FOLDER,
  TEMPORAL_FILES_FOLDER,
  ACTIVITY_LOGS_FOLDER,
  USER_SESSION_SECRET,
  MONGO_URI,
  ELASTICSEARCH_URL,
  DBHOST,
  SENTRY_API_DSN,
  MONGO_CONNECTION_POOL_SIZE,
  ENVIRONMENT,
} = process.env;

const rootPath = ROOT_PATH || `${__dirname}/../../`;

// this needs to be true in order for uwazi to work properly
// when using multiple node processes
const CLUSTER_MODE = process.env.CLUSTER_MODE || false;

const onlyDBHOST = () => (DBHOST ? `mongodb://${DBHOST}/` : 'mongodb://localhost/');

export const config = {
  VERSION: ENVIRONMENT ? version : `development-${version}`,

  ENVIRONMENT: ENVIRONMENT || 'development',

  PORT: process.env.PORT || 3000,

  DBHOST: MONGO_URI || onlyDBHOST(),

  mongo_connection_pool_size: Number(MONGO_CONNECTION_POOL_SIZE) || 5,

  rootPath,

  publicAssets: `${rootPath}/public/`,

  userSessionSecret: USER_SESSION_SECRET || uniqueID(),

  elasticsearch_nodes: ELASTICSEARCH_URL ? ELASTICSEARCH_URL.split(',') : ['http://localhost:9200'],

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
    activityLogs: ACTIVITY_LOGS_FOLDER || `${rootPath}/log/`,
    featureFlags: {
      s3Storage: false,
    },
  },
  externalServices: Boolean(process.env.EXTERNAL_SERVICES) || false,

  redis: {
    activated: CLUSTER_MODE,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '', 10) || 6379,
  },

  sentry: {
    dsn: SENTRY_API_DSN,
    tracesSampleRate: 0.1,
  },
  s3: {
    endpoint: process.env.S3_ENDPOINT || '',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },
};
