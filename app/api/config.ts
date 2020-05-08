import { Tenant } from './odm/tenantContext';

export const config = {
  PORT: process.env.PORT || 3000,

  DBHOST: process.env.DBHOST ? `mongodb://${process.env.DBHOST}/` : 'mongodb://localhost/',

  // db for tenants list and sessions
  SHARED_DB: 'uwazi_shared_db',

  defaultTenant: <Tenant>{
    dbName: process.env.DATABASE_NAME || 'uwazi_development',
    indexName: process.env.INDEX_NAME || 'uwazi_development',
  },
};
