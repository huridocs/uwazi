import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
// eslint-disable-next-line node/no-restricted-import
import { readFileSync } from 'fs';
import { hostname } from 'os';
import { z } from 'zod';
import { Tenant } from './tenants/tenantContext.js';
import uniqueID from '#shared/uniqueID.js';

dotenv.config();

const PostgresEnvSchema = z
  .object({
    POSTGRES_HOST: z.string().default('127.0.0.1'),
    POSTGRES_PORT: z.coerce.number().default(5432),
    POSTGRES_DB: z.string().default('uwazi_development'),
    POSTGRES_USER: z.string().default('migrator_user'),
    POSTGRES_PASSWORD: z.string().default('migrator_user'),
    POSTGRES_APP_USER: z.string().default('app_user'),
    POSTGRES_APP_PASSWORD: z.string().default('app_user'),
  })
  .passthrough();

const pgEnv = PostgresEnvSchema.parse(process.env);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(`${__dirname}/../../package.json`, 'utf-8'));
const { version } = packageJson;

const {
  ACTIVITY_LOGS_FOLDER,
  CUSTOM_UPLOADS_FOLDER,
  DBHOST,
  ELASTICSEARCH_URL,
  ENVIRONMENT,
  FEATURE_FLAG_FILE_CACHE_HEADERS,
  FEATURE_FLAG_PARAGRAPH_EXTRACTION,
  FEATURE_FLAG_THEME_CUSTOMIZATION,
  FEATURE_FLAG_AI_ASSISTANT,
  FEATURE_FLAG_POSTGRES_FILES,
  FEATURE_FLAG_POSTGRES_THESAURI,
  FEATURE_FLAG_POSTGRES_ENTITIES,
  FEATURE_FLAG_POSTGRES_TEMPLATES,
  FEATURE_FLAG_POSTGRES_RELATIONSHIP_TYPES,
  FEATURE_FLAG_ENTITY_VIEWER_V2,
  AI_ASSISTANT_SERVICE_URL,
  DEV_FLAG_TESTING,
  FILES_ROOT_PATH,
  JSON_LOGS,
  MONGO_CONNECTION_POOL_SIZE,
  MONGO_URI,
  QUEUE_NAME,
  ROOT_PATH,
  SENTRY_API_DSN,
  UPLOADS_FOLDER,
  USER_SESSION_SECRET,
  NEW_HEADER,
} = process.env;

const rootPath = ROOT_PATH || `${__dirname}/../../`;
const filesRootPath = FILES_ROOT_PATH || rootPath;

// this needs to be true in order for uwazi to work properly
// when using multiple node processes
const CLUSTER_MODE = process.env.CLUSTER_MODE || false;

const onlyDBHOST = () => (DBHOST ? `mongodb://${DBHOST}/` : 'mongodb://127.0.0.1/');

const defaultTenantS3Storage = false;
const defaultTenantName = 'default';

const getDefaultTenantPaths = () => {
  if (defaultTenantS3Storage) {
    return {
      uploadedDocuments: `${defaultTenantName}/uploaded_documents/`,
      attachments: `${defaultTenantName}/uploaded_documents/`,
      customUploads: `${defaultTenantName}/custom_uploads/`,
      activityLogs: `${defaultTenantName}/log/`,
    };
  }
  return {
    uploadedDocuments: UPLOADS_FOLDER || `${filesRootPath}/uploaded_documents/`,
    attachments: UPLOADS_FOLDER || `${filesRootPath}/uploaded_documents/`,
    customUploads: CUSTOM_UPLOADS_FOLDER || `${filesRootPath}/custom_uploads/`,
    activityLogs: ACTIVITY_LOGS_FOLDER || `${filesRootPath}/log/`,
  };
};

const defaultTenantPaths = getDefaultTenantPaths();

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

  mail: {
    defaultSenderEmail: process.env.DEFAULT_SENDER_EMAIL || 'no-reply@uwazi.io',
    defaultSiteName: process.env.DEFAULT_SITE_NAME || 'Uwazi',
  },

  SHARED_DB: process.env.NODE_ENV === 'test' ? 'uwazi_shared_db_testing' : 'uwazi_shared_db',

  multiTenant: process.env.MULTI_TENANT || false,
  clusterMode: CLUSTER_MODE,
  defaultTenant: <Tenant>{
    name: defaultTenantName,
    dbName:
      process.env.DATABASE_NAME ||
      (process.env.NODE_ENV === 'test' ? 'uwazi_testing' : 'uwazi_development'),
    indexName:
      process.env.INDEX_NAME ||
      (process.env.NODE_ENV === 'test' ? 'uwazi_testing' : 'uwazi_development'),
    uploadedDocuments: defaultTenantPaths.uploadedDocuments,
    attachments: defaultTenantPaths.attachments,
    customUploads: defaultTenantPaths.customUploads,
    activityLogs: defaultTenantPaths.activityLogs,
    domain: process.env.DEFAULT_TENANT_DOMAIN || `${hostname()}:${process.env.PORT || 3000}`,
    featureFlags: {
      s3Storage: defaultTenantS3Storage,
      esReplicas: 0,
      deactivateTestJob: false,
      paragraphExtraction: FEATURE_FLAG_PARAGRAPH_EXTRACTION === 'true' || false,
      fileCacheHeaders: FEATURE_FLAG_FILE_CACHE_HEADERS === 'true' || false,
      themeCustomization: FEATURE_FLAG_THEME_CUSTOMIZATION === 'true' || false,
      testing: DEV_FLAG_TESTING === 'true' || false,
      postgresFiles: FEATURE_FLAG_POSTGRES_FILES === 'true' || false,
      postgresThesauri: FEATURE_FLAG_POSTGRES_THESAURI === 'true' || false,
      postgresEntities: FEATURE_FLAG_POSTGRES_ENTITIES === 'true' || false,
      postgresTemplates: FEATURE_FLAG_POSTGRES_TEMPLATES === 'true' || false,
      postgresRelationshipTypes: FEATURE_FLAG_POSTGRES_RELATIONSHIP_TYPES === 'true' || false,
      postgresPasswordRecoveries: false,
      postgresUsers: false,
      postgresCaptchas: false,
      postgresUsergroups: false,
      newHeader: NEW_HEADER !== 'false',
      featureFlagEntityViewerv2: FEATURE_FLAG_ENTITY_VIEWER_V2 === 'true' || false,
      aiAssistant: FEATURE_FLAG_AI_ASSISTANT === 'true' || false,
      aiAssistantServiceUrl: AI_ASSISTANT_SERVICE_URL || undefined,
      v2UsersGet: false,
      usersDirectory: false,
      telemetry: {
        enabled: false,
        sampleRate: 0.5,
      },
      prometheus: {
        enabled: false,
        sampleRate: 0.5,
      },
      v2UsersUtilityRoutes: false,
      v2Auth2fa: false,
      v2PasswordReauth: false,
      v2Captcha: false,
      v2PrivateInstance: false,
      v2Usergroups: false,
    },
  },
  externalServices: (process.env.EXTERNAL_SERVICES || '').toLowerCase() === 'true',
  externalServicesUrls: {
    paragraphExtraction: process.env.PARAGRAPH_EXTRACTION_URL || 'http://localhost:5056',
    aiAssistant: AI_ASSISTANT_SERVICE_URL || 'http://localhost:5051',
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
    endpoint: process.env.S3_ENDPOINT || 'http://127.0.0.1:9000',
    bucket: process.env.S3_BUCKET || 'uwazi-development',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
    },
    batchSize: parseInt(process.env.S3_BATCH_SIZE || '', 10) || 1000,
  },
  githubToken: process.env.GITHUB_TOKEN || '',
  queueName: QUEUE_NAME || 'uwazi_jobs',

  postgres: {
    host: pgEnv.POSTGRES_HOST,
    port: pgEnv.POSTGRES_PORT,
    database: pgEnv.POSTGRES_DB,
    admin: {
      user: pgEnv.POSTGRES_USER,
      password: pgEnv.POSTGRES_PASSWORD,
    },
    app: {
      user: pgEnv.POSTGRES_APP_USER,
      password: pgEnv.POSTGRES_APP_PASSWORD,
    },
  },
};
