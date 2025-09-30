import uniqueID from 'shared/uniqueID';
import dotenv from 'dotenv';
import { Tenant } from './tenants/tenantContext';
import { version } from '../../package.json';

dotenv.config();

const {
  ACTIVITY_LOGS_FOLDER,
  CUSTOM_UPLOADS_FOLDER,
  DBHOST,
  ELASTICSEARCH_URL,
  ENVIRONMENT,
  FEATURE_FLAG_PARAGRAPH_EXTRACTION,
  FILES_ROOT_PATH,
  JSON_LOGS,
  MONGO_CONNECTION_POOL_SIZE,
  MONGO_URI,
  QUEUE_NAME,
  ROOT_PATH,
  SENTRY_API_DSN,
  UPLOADS_FOLDER,
  USER_SESSION_SECRET,
} = process.env;

const rootPath = ROOT_PATH || `${__dirname}/../../`;
const filesRootPath = FILES_ROOT_PATH || rootPath;

// this needs to be true in order for uwazi to work properly
// when using multiple node processes
const CLUSTER_MODE = process.env.CLUSTER_MODE || false;

const onlyDBHOST = () => (DBHOST ? `mongodb://${DBHOST}/` : 'mongodb://127.0.0.1/');

export const config = {
  VERSION: ENVIRONMENT ? version : `development-${version}`,

  JSON_LOGS: JSON_LOGS || false,

  ENVIRONMENT: ENVIRONMENT || 'development',

  PORT: process.env.PORT || 3000,

  DBHOST: MONGO_URI || onlyDBHOST(),
  DBAUTH: {
    user: process.env.DBUSER,
    pass: process.env.DBPASS,
  },

  mongo_connection_pool_size: Number(MONGO_CONNECTION_POOL_SIZE) || 5,

  rootPath,

  publicAssets: `${rootPath}/public/`,

  userSessionSecret: USER_SESSION_SECRET || uniqueID(),

  elasticsearch: {
    nodes: ELASTICSEARCH_URL ? ELASTICSEARCH_URL.split(',') : ['http://localhost:9200'],
    requestTimeout: 60000,
    auth: {
      apiKey: process.env.ELASTICSEARCH_API_KEY || '',
    },
  },

  // db for tenants list and sessions
  SHARED_DB: 'uwazi_shared_db',

  multiTenant: process.env.MULTI_TENANT || false,
  clusterMode: CLUSTER_MODE,
  defaultTenant: <Tenant>{
    name: 'default',
    dbName:
      process.env.DATABASE_NAME ||
      (process.env.NODE_ENV === 'test' ? 'uwazi_testing' : 'uwazi_development'),
    indexName:
      process.env.INDEX_NAME ||
      (process.env.NODE_ENV === 'test' ? 'uwazi_testing' : 'uwazi_development'),
    uploadedDocuments: UPLOADS_FOLDER || `${filesRootPath}/uploaded_documents/`,
    attachments: UPLOADS_FOLDER || `${filesRootPath}/uploaded_documents/`,
    customUploads: CUSTOM_UPLOADS_FOLDER || `${filesRootPath}/custom_uploads/`,
    activityLogs: ACTIVITY_LOGS_FOLDER || `${filesRootPath}/log/`,
    featureFlags: {
      s3Storage: false,
      esReplicas: 0,
      deactivateTestJob: false,
      paragraphExtraction: FEATURE_FLAG_PARAGRAPH_EXTRACTION === 'true' || false,
      v2UpdateTemplateUseCase: false,
    },
  },
  externalServices: (process.env.EXTERNAL_SERVICES || '').toLowerCase() === 'true',
  externalServicesUrls: {
    paragraphExtraction: process.env.PARAGRAPH_EXTRACTION_URL || 'http://localhost:5056',
  },

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
    bucket: process.env.S3_BUCKET || '',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    batchSize: parseInt(process.env.S3_BATCH_SIZE || '', 10) || 1000,
  },
  githubToken: process.env.GITHUB_TOKEN || '',
  queueName: QUEUE_NAME || 'uwazi_jobs',
};
